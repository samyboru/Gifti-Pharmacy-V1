// File Location: server/services/notificationService.js

const pool = require('../db');

const notificationService = {
  /**
   * Scans inventory and generates notifications for:
   * 1. Expired Items
   * 2. Expiring Soon (next 30 days)
   * 3. Out of Stock (Product Level)
   * 4. Low Stock (Batch Level)
   */
  generateAlerts: async () => {
    console.log('--- Running Inventory Health Check ---');
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // ---------------------------------------------------------
      // 1. CHECK EXPIRED BATCHES (Stock > 0 but Date passed)
      // ---------------------------------------------------------
      const expiredQuery = `
        SELECT i.id, i.product_id, i.batch_number, p.name, i.expiry_date 
        FROM inventory_items i
        JOIN products p ON i.product_id = p.id
        WHERE i.expiry_date < CURRENT_DATE 
        AND i.quantity_of_packages > 0
      `;
      const expired = await client.query(expiredQuery);

      for (const item of expired.rows) {
        await createNotificationIfNotExists(client, {
            productId: item.product_id,
            type: 'expired',
            // JSON message for translation support
            message: JSON.stringify({ 
                key: 'notifications.expired', 
                name: item.name, 
                batch: item.batch_number 
            }),
            // Smart Link: Filters by status AND searches for specific batch
            link: `/inventory?status=expired&search=${item.batch_number}`
        });
      }

      // ---------------------------------------------------------
      // 2. CHECK EXPIRING SOON (Next 30 Days)
      // ---------------------------------------------------------
      const soonQuery = `
        SELECT i.id, i.product_id, i.batch_number, p.name, i.expiry_date 
        FROM inventory_items i
        JOIN products p ON i.product_id = p.id
        WHERE i.expiry_date >= CURRENT_DATE 
        AND i.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        AND i.quantity_of_packages > 0
      `;
      const soon = await client.query(soonQuery);

      for (const item of soon.rows) {
        await createNotificationIfNotExists(client, {
            productId: item.product_id,
            type: 'expiring_soon',
            message: JSON.stringify({ 
                key: 'notifications.expiringSoon', 
                name: item.name, 
                batch: item.batch_number,
                date: new Date(item.expiry_date).toLocaleDateString()
            }),
            link: `/inventory?status=expiring_soon&search=${item.batch_number}`
        });
      }

      // ---------------------------------------------------------
      // 3. CHECK OUT OF STOCK (Aggregated by Product)
      // If total stock of all batches for a product is 0
      // ---------------------------------------------------------
      const outOfStockQuery = `
        SELECT p.id as product_id, p.name, COALESCE(SUM(i.quantity_of_packages), 0) as total_stock
        FROM products p
        LEFT JOIN inventory_items i ON p.id = i.product_id
        GROUP BY p.id, p.name
        HAVING COALESCE(SUM(i.quantity_of_packages), 0) = 0
      `;
      const outStock = await client.query(outOfStockQuery);

      for (const item of outStock.rows) {
        await createNotificationIfNotExists(client, {
            productId: item.product_id,
            type: 'out_of_stock',
            message: JSON.stringify({ 
                key: 'notifications.outOfStock', 
                name: item.name,
                batch: 'N/A'
            }),
            link: `/inventory?status=out_of_stock&search=${item.name}`
        });
      }

      // ---------------------------------------------------------
      // 4. CHECK LOW STOCK (Per Batch <= 10)
      // ---------------------------------------------------------
      const lowStockQuery = `
        SELECT i.id, i.product_id, i.batch_number, p.name, i.quantity_of_packages
        FROM inventory_items i
        JOIN products p ON i.product_id = p.id
        WHERE i.quantity_of_packages > 0 
        AND i.quantity_of_packages <= 10
      `;
      const lowStock = await client.query(lowStockQuery);

      for (const item of lowStock.rows) {
        await createNotificationIfNotExists(client, {
            productId: item.product_id,
            type: 'low_stock',
            message: JSON.stringify({ 
                key: 'notifications.lowStock', 
                name: item.name, 
                batch: item.batch_number,
                count: item.quantity_of_packages
            }),
            link: `/inventory?status=low_stock&search=${item.batch_number}`
        });
      }

      await client.query('COMMIT');
      console.log(`--- Inventory Health Check Completed. Processed ${expired.rowCount + soon.rowCount + outStock.rowCount + lowStock.rowCount} potential issues. ---`);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error generating alerts:', error);
    } finally {
      client.release();
    }
  }
};

/**
 * Helper: Inserts notification ONLY if an unread one doesn't already exist.
 * This prevents spamming the user with the same alert every hour.
 */
async function createNotificationIfNotExists(client, { productId, type, message, link }) {
    // Check for existing UNREAD notification for this product + type
    const check = await client.query(
        `SELECT id FROM notifications 
         WHERE product_id = $1 AND type = $2 AND is_read = FALSE`,
        [productId, type]
    );

    if (check.rows.length === 0) {
        await client.query(
            `INSERT INTO notifications (product_id, type, message, link, is_read)
             VALUES ($1, $2, $3, $4, FALSE)`,
            [productId, type, message, link]
        );
        console.log(`>> Generated Alert: ${type} for Product ID ${productId}`);
    }
}

module.exports = notificationService;