import { AppDataSource } from '../../modules/database/data-source';
import { Role, UserStatus } from '@sllas/contracts';

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const optional = (name: string): string | null => process.env[name]?.trim() || null;

async function provisionUser() {
  const subject = required('KEYCLOAK_SUBJECT');
  const email = required('USER_EMAIL').toLowerCase();
  const firstName = required('USER_FIRST_NAME');
  const lastName = required('USER_LAST_NAME');
  const role = required('USER_ROLE') as Role;
  const phoneNumber = optional('USER_PHONE');
  const officeId = optional('USER_OFFICE_ID');
  const provinceId = optional('USER_PROVINCE_ID');
  const districtId = optional('USER_DISTRICT_ID');

  if (!Object.values(Role).includes(role)) {
    throw new Error(`USER_ROLE must be one of: ${Object.values(Role).join(', ')}`);
  }

  await AppDataSource.initialize();
  try {
    await AppDataSource.transaction(async (manager) => {
      const existingIdentity = await manager.query(
        `SELECT "user_id" FROM "user_identities"
         WHERE "provider" = 'keycloak' AND "provider_subject" = $1
         FOR UPDATE`,
        [subject],
      );

      const existingUser = await manager.query(
        `SELECT "id" FROM "users" WHERE lower("email") = lower($1) FOR UPDATE`,
        [email],
      );

      let userId: string;
      if (existingIdentity.length > 0) {
        userId = existingIdentity[0].user_id;
        if (existingUser.length > 0 && existingUser[0].id !== userId) {
          throw new Error('USER_EMAIL belongs to a different user than KEYCLOAK_SUBJECT');
        }
        await manager.query(
          `UPDATE "users"
           SET "email" = $1, "first_name" = $2, "last_name" = $3,
               "phone_number" = $4, "role" = $5, "status" = $6,
               "office_id" = $7, "province_id" = $8, "district_id" = $9,
               "updated_at" = now()
           WHERE "id" = $10`,
          [email, firstName, lastName, phoneNumber, role, UserStatus.ACTIVE, officeId, provinceId, districtId, userId],
        );
      } else {
        if (existingUser.length > 0) {
          userId = existingUser[0].id;
          await manager.query(
            `UPDATE "users"
             SET "first_name" = $1, "last_name" = $2, "phone_number" = $3,
                 "role" = $4, "status" = $5, "office_id" = $6,
                 "province_id" = $7, "district_id" = $8, "updated_at" = now()
             WHERE "id" = $9`,
            [firstName, lastName, phoneNumber, role, UserStatus.ACTIVE, officeId, provinceId, districtId, userId],
          );
        } else {
          const created = await manager.query(
            `INSERT INTO "users"
             ("email", "first_name", "last_name", "phone_number", "role", "status", "office_id", "province_id", "district_id")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING "id"`,
            [email, firstName, lastName, phoneNumber, role, UserStatus.ACTIVE, officeId, provinceId, districtId],
          );
          userId = created[0].id;
        }

        await manager.query(
          `INSERT INTO "user_identities" ("user_id", "provider", "provider_subject")
           VALUES ($1, 'keycloak', $2)`,
          [userId, subject],
        );
      }

      console.log(`Provisioned ${email} (${role}) with Keycloak subject ${subject}`);
    });
  } finally {
    await AppDataSource.destroy();
  }
}

provisionUser().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
