export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();

    const phone = String(body.phone || "").replace(/\D/g, "");
    const sessionId = String(body.session_id || "");

    if (!/^0\d{9}$/.test(phone)) {
      return Response.json(
        { ok: false, error: "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก" },
        { status: 400 }
      );
    }

    if (!sessionId.startsWith("cs_")) {
      return Response.json(
        { ok: false, error: "ยังไม่พบข้อมูลการชำระเงิน" },
        { status: 402 }
      );
    }

    const stripeRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        },
      }
    );

    if (!stripeRes.ok) {
      return Response.json(
        { ok: false, error: "ตรวจสอบการชำระเงินไม่สำเร็จ" },
        { status: 402 }
      );
    }

    const session = await stripeRes.json();

    if (session.payment_status !== "paid") {
      return Response.json(
        { ok: false, error: "กรุณาชำระเงิน ฿29 ก่อนดูผลวิเคราะห์" },
        { status: 402 }
      );
    }

    return Response.json({
      ok: true,
      paid: true,
      phone,
    });
  } catch (err) {
    return Response.json(
      { ok: false, error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  
}
}
