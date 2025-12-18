// Simple email service for low stock alerts
// In a production environment, this would integrate with a proper email service like SendGrid, AWS SES, etc.

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // For development/demo purposes, we'll just log the email
  // In production, replace this with actual email service integration
  
  console.log('=== EMAIL NOTIFICATION ===');
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Text: ${options.text}`);
  if (options.html) {
    console.log(`HTML: ${options.html}`);
  }
  console.log('=== END EMAIL ===');
  
  // Simulate email sending success
  return true;
}

export async function sendLowStockAlertEmail(
  productName: string,
  productSku: string,
  currentQuantity: number,
  threshold: number,
  recipientEmail: string = process.env.ALERT_EMAIL_RECIPIENT || 'inventory-manager@example.com'
): Promise<boolean> {
  const subject = `Low Stock Alert: ${productName} (SKU: ${productSku})`;
  
  const text = `
    Low Stock Alert
    
    Product: ${productName}
    SKU: ${productSku}
    Current Quantity: ${currentQuantity}
    Threshold: ${threshold}
    
    Please reorder this product soon to avoid stockouts.
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">⚠️ Low Stock Alert</h2>
      <p>The following product has fallen below its low stock threshold:</p>
      
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3>${productName}</h3>
        <p><strong>SKU:</strong> ${productSku}</p>
        <p><strong>Current Quantity:</strong> ${currentQuantity}</p>
        <p><strong>Threshold:</strong> ${threshold}</p>
      </div>
      
      <p style="color: #dc2626; font-weight: bold;">Please reorder this product soon to avoid stockouts.</p>
      
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #6b7280;">This is an automated message from ForgePoint Inventory System.</p>
    </div>
  `;
  
  return sendEmail({
    to: recipientEmail,
    subject,
    text,
    html,
  });
}