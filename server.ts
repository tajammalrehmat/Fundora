import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables from .env
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies with increased limits for base64 screenshots
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route to proxy Resend Email requests (Bypasses browser CORS policy)
  app.post("/api/send-otp", async (req, res) => {
    const { toEmail, toName, otpCode } = req.body;

    if (!toEmail || !otpCode) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: toEmail and otpCode are required."
      });
    }

    const resendApiKey = (process.env.VITE_RESEND_API_KEY || "").trim();
    const resendFromEmail = (process.env.VITE_RESEND_FROM_EMAIL || "no-reply@fundora.one").trim();

    if (!resendApiKey) {
      console.error("Resend API key is not configured in .env on the server.");
      return res.status(500).json({
        success: false,
        error: "Resend API Key is not configured on the server. Please check your environment setup."
      });
    }

    try {
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Fundora OTP</title>
</head>

<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 0 10px rgba(0,0,0,.08);">

<tr>
<td style="background:#0d6efd;color:#ffffff;padding:20px;text-align:center;font-size:26px;font-weight:bold;">
Fundora
</td>
</tr>

<tr>
<td style="padding:35px;">

<h2 style="margin-top:0;color:#222;">
Verify Your Email
</h2>

<p style="font-size:16px;color:#555;">
Hello ${toName || 'Investor'},
</p>

<p style="font-size:16px;color:#555;line-height:26px;">
Use the verification code below to complete your registration.
</p>

<div style="margin:35px 0;text-align:center;">

<div style="
display:inline-block;
background:#0d6efd;
color:#fff;
padding:18px 35px;
font-size:34px;
font-weight:bold;
letter-spacing:8px;
border-radius:8px;">
${otpCode}
</div>

</div>

<p style="font-size:15px;color:#777;">
This code will expire in <strong>10 minutes</strong>.
</p>

<p style="font-size:15px;color:#777;">
If you didn't request this verification, simply ignore this email.
</p>

<hr>

<p style="font-size:13px;color:#999;text-align:center;">
© 2026 Fundora. All rights reserved.
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`;

      console.log(`[Resend Server Proxy] Dispatching OTP email to ${toEmail} from ${resendFromEmail}...`);

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `Fundora <${resendFromEmail}>`,
          to: [toEmail],
          subject: "Your Fundora Verification Code",
          html: htmlContent
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log(`[Resend Server Proxy] Email sent successfully to ${toEmail}:`, responseData);
        return res.json({ success: true, data: responseData });
      } else {
        const errorText = await response.text();
        console.error(`[Resend Server Proxy] Resend API failed:`, errorText);
        return res.status(response.status).json({
          success: false,
          error: errorText || "Resend API failed to accept the email."
        });
      }
    } catch (error: any) {
      console.error("[Resend Server Proxy] Network/Server exception:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "An exception occurred during server-side email dispatch."
      });
    }
  });

  // API Route to analyze uploaded screenshot receipt using Gemini 3.5 Flash
  app.post("/api/analyze-receipt", async (req, res) => {
    const { base64Data, mimeType } = req.body;

    if (!base64Data) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: base64Data is required."
      });
    }

    try {
      // 1. Initialize GoogleGenAI client (lazy initialization)
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY environment variable is not set. Using simulated receipt analyzer logic.");
        return res.json({
          success: true,
          simulated: true,
          data: {
            txid: "TX" + Math.random().toString(16).slice(2, 10) + Date.now().toString(16) + "e880bc",
            amount: 150,
            network: "TRC20"
          },
          warning: "No GEMINI_API_KEY detected in environment variables. Returning simulated receipt data."
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // 2. Extract clean base64 data and mimeType if nested in data URI
      let cleanBase64 = base64Data;
      let detectedMimeType = mimeType || "image/png";

      if (base64Data.startsWith("data:")) {
        const parts = base64Data.split(";base64,");
        if (parts.length === 2) {
          detectedMimeType = parts[0].replace("data:", "").split(";")[0];
          cleanBase64 = parts[1];
        }
      }

      console.log(`[Receipt Analyzer] Triggering Gemini 3.5 Flash for receipt parsing, size: ~${Math.round(cleanBase64.length / 1024)} KB, mime: ${detectedMimeType}...`);

      // 3. Formulate the multimodal parts for Gemini
      const imagePart = {
        inlineData: {
          mimeType: detectedMimeType,
          data: cleanBase64,
        },
      };

      const promptPart = {
        text: "You are an AI-powered payment auditor. Carefully analyze this receipt or screenshot of a crypto transfer (USDT). " +
              "Identify and extract the following fields precisely:\n" +
              "1. 'txid': The transaction hash, transaction ID, or reference code (usually a long alphanumeric/hexadecimal string like 'TX...' or '0x...'). Do NOT include words like 'TxID' or 'Transaction ID' inside the string, just the clean hash itself.\n" +
              "2. 'amount': The exact transfer or deposit amount of USDT parsed as a number. Only return the number (e.g. 150).\n" +
              "3. 'network': The matching blockchain transfer network. Look for signs of 'TRC20', 'TRX', 'Tron', 'BEP20', 'BSC', 'BNB Smart Chain'. Return either 'TRC20' or 'BEP20'. If not clearly mentioned, default to 'TRC20' if it starts with 'T', or 'BEP20' if the address starts with '0x'. If no network is found, return null.\n\n" +
              "Format the output STRICTLY as JSON matching the schema.",
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, promptPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              txid: {
                type: Type.STRING,
                description: "The transaction hash, ID or TxID from the screenshot.",
              },
              amount: {
                type: Type.NUMBER,
                description: "The transfer amount parsed as a number.",
              },
              network: {
                type: Type.STRING,
                description: "The blockchain network ('TRC20' or 'BEP20').",
              }
            },
            required: ["txid", "amount", "network"],
          }
        }
      });

      const responseText = response.text || "{}";
      console.log(`[Receipt Analyzer] Gemini Raw Response:`, responseText);
      
      const parsedData = JSON.parse(responseText.trim());

      return res.json({
        success: true,
        data: parsedData
      });

    } catch (error: any) {
      console.error("[Receipt Analyzer] Error parsing receipt screenshot:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "An error occurred during Gemini AI screenshot analysis."
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Redirect direct /join paths to client-side SPA hash routing
  app.get("/join", (req, res) => {
    const ref = req.query.ref || "";
    const redirectUrl = ref ? `/#/register?ref=${ref}` : "/#/register";
    console.log(`[Redirect] /join path accessed. Redirecting to ${redirectUrl}`);
    res.redirect(redirectUrl);
  });

  // Redirect direct /register paths to client-side SPA hash routing
  app.get("/register", (req, res) => {
    const ref = req.query.ref || "";
    const redirectUrl = ref ? `/#/register?ref=${ref}` : "/#/register";
    console.log(`[Redirect] /register path accessed. Redirecting to ${redirectUrl}`);
    res.redirect(redirectUrl);
  });

  // Integrate Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start the Express proxy server:", err);
});
