import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

interface EmailRequest {
  action: 'order_confirmation' | 'welcome' | 'shipping_update'
  email: string
  name?: string
  orderNumber?: string
  orderData?: any
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const body: EmailRequest = await req.json()
    const { action, email, name, orderNumber, orderData } = body

    // In production, integrate with SendGrid, Mailgun, or similar
    // For now, we'll log and return success
    console.log(`Email request: ${action} to ${email}`)

    let subject = ''
    let html = ''

    switch (action) {
      case 'order_confirmation':
        subject = `Order Confirmation - ${orderNumber}`
        html = generateOrderConfirmationEmail(name || 'Customer', orderNumber, orderData)
        break
      case 'welcome':
        subject = 'Welcome to Lazar Store!'
        html = generateWelcomeEmail(name || 'Customer')
        break
      case 'shipping_update':
        subject = `Your order ${orderNumber} has shipped!`
        html = generateShippingUpdateEmail(name || 'Customer', orderNumber)
        break
      default:
        throw new Error('Invalid action')
    }

    // Log email content for debugging
    console.log('Email subject:', subject)
    console.log('Email HTML length:', html.length)

    // In production: send via email service
    // await sendEmailViaService(email, subject, html)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email ${action} queued for ${email}`,
        subject
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Email error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateOrderConfirmationEmail(name: string, orderNumber: string, orderData: any): string {
  const items = orderData?.items?.map((item: any) => `
    <tr style="border-bottom: 1px solid #eee">
      <td style="padding: 12px 0">${item.product_name}</td>
      <td style="padding: 12px 0; text-align: center">${item.quantity}</td>
      <td style="padding: 12px 0; text-align: right">$${item.total}</td>
    </tr>
  `).join('') || ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Inter, -apple-system, sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #000000; color: #ffffff; padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 3px">LAZAR</h1>
        </div>

        <div style="padding: 40px">
          <h2 style="font-size: 24px; margin-bottom: 8px">Thank you, ${name}!</h2>
          <p style="color: #666; margin-bottom: 32px">Your order has been confirmed and is being processed.</p>

          <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px; margin-bottom: 32px; text-align: center">
            <p style="margin: 0; color: #666; font-size: 13px">Order Number</p>
            <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 600">${orderNumber}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px">
            <thead>
              <tr style="border-bottom: 1px solid #000">
                <th style="padding: 12px 0; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px">Product</th>
                <th style="padding: 12px 0; text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 1px">Qty</th>
                <th style="padding: 12px 0; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 1px">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items}
            </tbody>
          </table>

          <div style="text-align: right; padding-top: 16px; border-top: 1px solid #000">
            <p style="margin: 8px 0; font-size: 18px">
              <strong style="font-size: 14px; color: #666; font-weight: 400">Total</strong>
              <strong style="margin-left: 24px">$${orderData?.total || '0.00'}</strong>
            </p>
          </div>

          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #eee">
            <p style="font-size: 14px; color: #666">
              We'll send you another email when your order ships. If you have any questions, please don't hesitate to contact us.
            </p>
          </div>
        </div>

        <div style="background-color: #f5f5f5; padding: 24px; text-align: center">
          <p style="margin: 0; font-size: 13px; color: #666">
            © ${new Date().getFullYear()} Lazar Store. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateWelcomeEmail(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Lazar</title>
    </head>
    <body style="font-family: Inter, -apple-system, sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #000000; color: #ffffff; padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 3px">LAZAR</h1>
        </div>

        <div style="padding: 40px; text-align: center">
          <h2 style="font-size: 24px; margin-bottom: 16px">Welcome, ${name}!</h2>
          <p style="color: #666; margin-bottom: 32px">Thank you for joining Lazar Store. We're thrilled to have you as part of our community.</p>

          <a href="https://lazar.store/shop" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 500">
            Start Shopping
          </a>

          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #eee">
            <p style="font-size: 14px; color: #666">
              Use code <strong style="color: #000">WELCOME10</strong> for 10% off your first order!
            </p>
          </div>
        </div>

        <div style="background-color: #f5f5f5; padding: 24px; text-align: center">
          <p style="margin: 0; font-size: 13px; color: #666">
            © ${new Date().getFullYear()} Lazar Store. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateShippingUpdateEmail(name: string, orderNumber: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Order Has Shipped</title>
    </head>
    <body style="font-family: Inter, -apple-system, sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #000000; color: #ffffff; padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 3px">LAZAR</h1>
        </div>

        <div style="padding: 40px">
          <h2 style="font-size: 24px; margin-bottom: 8px">Great news, ${name}!</h2>
          <p style="color: #666; margin-bottom: 32px">Your order is on its way!</p>

          <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px; margin-bottom: 32px; text-align: center">
            <p style="margin: 0; color: #666; font-size: 13px">Order Number</p>
            <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 600">${orderNumber}</p>
          </div>

          <div style="background-color: #dcfce7; border-radius: 8px; padding: 20px; text-align: center">
            <p style="margin: 0; font-size: 18px; color: #166534">
              <strong>Your package is on the way!</strong>
            </p>
          </div>

          <p style="margin-top: 24px; font-size: 14px; color: #666; text-align: center">
            Estimated delivery: 3-5 business days
          </p>
        </div>

        <div style="background-color: #f5f5f5; padding: 24px; text-align: center">
          <p style="margin: 0; font-size: 13px; color: #666">
            © ${new Date().getFullYear()} Lazar Store. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
