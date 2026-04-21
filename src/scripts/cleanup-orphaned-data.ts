import AppDataSource from '../config/data-source';

const cleanupStatements = [
  {
    label: 'product regions without products',
    sql: `
      DELETE FROM "product_regions" pr
      WHERE NOT EXISTS (
        SELECT 1 FROM "products" p WHERE p."id" = pr."productId"
      )
      RETURNING "id";
    `,
  },
  {
    label: 'product networks without products',
    sql: `
      DELETE FROM "product_networks" pn
      WHERE NOT EXISTS (
        SELECT 1 FROM "products" p WHERE p."id" = pn."productId"
      )
      RETURNING "id";
    `,
  },
  {
    label: 'direct product colors without products',
    sql: `
      DELETE FROM "product_colors" pc
      WHERE pc."productId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "products" p WHERE p."id" = pc."productId"
      )
      RETURNING "id";
    `,
  },
  {
    label: 'region colors without regions',
    sql: `
      DELETE FROM "product_colors" pc
      WHERE pc."regionId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "product_regions" pr WHERE pr."id" = pc."regionId"
      )
      RETURNING "id";
    `,
  },
  {
    label: 'network colors without networks',
    sql: `
      DELETE FROM "product_colors" pc
      WHERE pc."networkId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "product_networks" pn WHERE pn."id" = pc."networkId"
      )
      RETURNING "id";
    `,
  },
  {
    label: 'storages without parent variants',
    sql: `
      DELETE FROM "product_storages" ps
      WHERE (
        ps."colorId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "product_colors" pc WHERE pc."id" = ps."colorId"
        )
      )
      OR (
        ps."regionId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "product_regions" pr WHERE pr."id" = ps."regionId"
        )
      )
      OR (
        ps."networkId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "product_networks" pn WHERE pn."id" = ps."networkId"
        )
      )
      RETURNING "id";
    `,
  },
  {
    label: 'prices without storages',
    sql: `
      DELETE FROM "product_prices" pp
      WHERE NOT EXISTS (
        SELECT 1 FROM "product_storages" ps WHERE ps."id" = pp."storageId"
      )
      RETURNING "id";
    `,
  },
  {
    label: 'images without products',
    sql: `
      DELETE FROM "product_images" pi
      WHERE NOT EXISTS (
        SELECT 1 FROM "products" p WHERE p."id" = pi."productId"
      )
      RETURNING "id";
    `,
  },
  {
    label: 'videos without products',
    sql: `
      DELETE FROM "product_videos" pv
      WHERE NOT EXISTS (
        SELECT 1 FROM "products" p WHERE p."id" = pv."productId"
      )
      RETURNING "id";
    `,
  },
  {
    label: 'specifications without products',
    sql: `
      DELETE FROM "product_specifications" ps
      WHERE NOT EXISTS (
        SELECT 1 FROM "products" p WHERE p."id" = ps."productId"
      )
      RETURNING "id";
    `,
  },
];

async function cleanupOrphanedData() {
  await AppDataSource.initialize();

  try {
    for (const statement of cleanupStatements) {
      const rows = await AppDataSource.query(statement.sql);
      console.log(`Deleted ${rows.length} ${statement.label}`);
    }
    console.log('PostgreSQL orphan cleanup completed successfully.');
  } finally {
    await AppDataSource.destroy();
  }
}

cleanupOrphanedData().catch((error) => {
  console.error('Error during PostgreSQL cleanup:', error);
  process.exit(1);
});
