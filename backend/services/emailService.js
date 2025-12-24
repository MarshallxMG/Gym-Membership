const sgMail = require('@sendgrid/mail');

// Email configuration - Using SendGrid Web API (HTTP - not blocked by Render)
let emailConfigured = false;

function initializeEmail() {
    if (!emailConfigured && process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        emailConfigured = true;
        console.log('✅ Email service configured (SendGrid Web API)');
    }
    return emailConfigured;
}

// Send membership expiry email to USER
async function sendExpiryEmail(userEmail, userName, membership, timeRemaining, isTestMode = false) {
    if (!initializeEmail()) {
        console.log('⚠️ Email not configured - skipping email to', userEmail);
        return false;
    }

    const timeUnit = isTestMode ? 'minutes' : 'days';
    let subject, urgencyColor;
    
    if (timeRemaining <= (isTestMode ? 2 : 1)) {
        subject = `⚠️ URGENT: Your Gym Membership Expires in ${timeRemaining} ${timeUnit}!`;
        urgencyColor = '#e53e3e';
    } else if (timeRemaining <= (isTestMode ? 5 : 3)) {
        subject = `🔔 Reminder: Gym Membership Expires in ${timeRemaining} ${timeUnit}`;
        urgencyColor = '#ed8936';
    } else {
        subject = `📅 Heads Up: Gym Membership Expires in ${timeRemaining} ${timeUnit}`;
        urgencyColor = '#667eea';
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🏋️ GymPro</h1>
                ${isTestMode ? '<p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 12px;">TEST MODE</p>' : ''}
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">Hello ${userName}! 👋</h2>
                
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    This is a <strong>reminder</strong> that your <strong>${membership.plan_type}</strong> membership 
                    <strong style="color: ${urgencyColor};">expires in ${timeRemaining} ${timeUnit}</strong>.
                </p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 8px 0; color: #666;">Plan:</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">${membership.plan_type}</td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Expiry:</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">${membership.end_date}</td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Time Left:</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: ${urgencyColor};">${timeRemaining} ${timeUnit}</td></tr>
                    </table>
                </div>
                
                <p style="color: #555; font-size: 16px;">Please renew your membership to continue enjoying our facilities!</p>
            </div>
            
            <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
                This is an automated reminder from GymPro.
            </p>
        </div>
    </body>
    </html>
    `;

    try {
        await sgMail.send({
            to: userEmail,
            from: process.env.EMAIL_FROM || 'noreply@gympro.com',
            subject: subject,
            html: htmlContent
        });
        console.log(`📧 [USER] Email sent to ${userName} (${userEmail})`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send email to ${userEmail}:`, error.message);
        return false;
    }
}

// Send notification email to ADMIN about expiring membership
async function sendAdminNotificationEmail(adminEmail, userName, userEmail, membership, timeRemaining, isTestMode = false) {
    if (!initializeEmail()) {
        console.log('⚠️ Email not configured - skipping admin notification');
        return false;
    }

    const timeUnit = isTestMode ? 'minutes' : 'days';
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🏋️ GymPro Admin</h1>
                ${isTestMode ? '<p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 12px;">TEST MODE</p>' : ''}
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">Member Expiry Alert 🔔</h2>
                
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    <strong>${userName}</strong> (${userEmail}) has a membership expiring in <strong>${timeRemaining} ${timeUnit}</strong>.
                </p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 8px 0; color: #666;">Member:</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">${userName}</td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Email:</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">${userEmail}</td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Plan:</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">${membership.plan_type}</td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Expiry:</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">${membership.end_date}</td></tr>
                    </table>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        await sgMail.send({
            to: adminEmail,
            from: process.env.EMAIL_FROM || 'noreply@gympro.com',
            subject: `🔔 Member Expiry: ${userName} - ${timeRemaining} ${timeUnit}`,
            html: htmlContent
        });
        console.log(`📧 [ADMIN] Notification sent for ${userName}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send admin notification:`, error.message);
        return false;
    }
}

// Send membership expired email
async function sendExpiredEmail(userEmail, userName, membership) {
    if (!initializeEmail()) return false;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #e53e3e; padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">🏋️ GymPro</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px;">
                <h2>Hello ${userName}!</h2>
                <p>Your <strong>${membership.plan_type}</strong> membership has <strong style="color: #e53e3e;">expired</strong>.</p>
                <p>Please renew your membership to continue accessing our gym facilities.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        await sgMail.send({
            to: userEmail,
            from: process.env.EMAIL_FROM || 'noreply@gympro.com',
            subject: '❌ Your Gym Membership Has Expired',
            html: htmlContent
        });
        console.log(`📧 Expiry email sent to ${userName} (${userEmail})`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send expiry email to ${userEmail}:`, error.message);
        return false;
    }
}

// Send registration OTP email
async function sendRegistrationOTPEmail(email, name, otp) {
    if (!initializeEmail()) {
        console.log('⚠️ Email not configured - skipping OTP email');
        return false;
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🏋️ GymPro</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Email Verification</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">Welcome ${name}! 👋</h2>
                
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    Thank you for registering with GymPro! Please use the following OTP to verify your email address:
                </p>
                
                <div style="background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                    <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px;">${otp}</span>
                </div>
                
                <p style="color: #888; font-size: 14px;">
                    This OTP is valid for <strong>10 minutes</strong>. Don't share it with anyone.
                </p>
            </div>
            
            <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
                If you didn't request this, please ignore this email.
            </p>
        </div>
    </body>
    </html>
    `;

    try {
        await sgMail.send({
            to: email,
            from: process.env.EMAIL_FROM || 'noreply@gympro.com',
            subject: '🔐 GymPro - Verify Your Email',
            html: htmlContent
        });
        console.log(`📧 Registration OTP sent to ${email}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send registration OTP to ${email}:`, error.message);
        return false;
    }
}

module.exports = { sendExpiryEmail, sendAdminNotificationEmail, sendExpiredEmail, sendRegistrationOTPEmail, initializeEmail };
