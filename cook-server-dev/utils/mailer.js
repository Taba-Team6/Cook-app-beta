import nodemailer from "nodemailer";

export async function sendVerifyEmail(email, verifyUrl) {
  if (!email) {
    throw new Error("sendVerifyEmail: email is undefined");
  }

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"쿠킹메이트" <${process.env.MAIL_USER}>`,
    to: email,                      // ✅ 반드시 있어야 함
    subject: "쿠킹메이트 이메일 인증",
    html: `
      <h2>이메일 인증</h2>
      <p>아래 버튼을 클릭해주세요</p>
      <a href="${verifyUrl}">이메일 인증하기</a>
    `,
  });
}