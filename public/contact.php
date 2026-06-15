<?php
/**
 * Noga Aluminum - contact form handler.
 * Receives the static site's contact form and emails the lead.
 * Deployed to Hostinger (PHP). Static pages POST here.
 */

$TO   = 'support@noga-aluminum.co.il';
$FROM = 'no-reply@noga-aluminum.co.il';

function back($ok) {
  $ref = $_SERVER['HTTP_REFERER'] ?? '/';
  $sep = (strpos($ref, '?') === false) ? '?' : '&';
  header('Location: ' . $ref . $sep . ($ok ? 'sent=1' : 'error=1') . '#main');
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); back(false); }

// Honeypot - bots fill this hidden field.
if (!empty($_POST['website'])) { back(true); }

$name    = trim($_POST['name'] ?? '');
$phone   = trim($_POST['phone'] ?? '');
$city    = trim($_POST['city'] ?? '');
$message = trim($_POST['message'] ?? '');
$page    = trim($_POST['page'] ?? '');

if ($name === '' || $phone === '') { back(false); }

// Sanitize for header safety.
$clean = fn($s) => str_replace(["\r", "\n"], ' ', $s);
$name = $clean($name); $phone = $clean($phone); $city = $clean($city);

$subject = "פנייה חדשה מהאתר - $name";
$body  = "התקבלה פנייה חדשה מאתר נוגה אלומיניום:\n\n";
$body .= "שם: $name\n";
$body .= "טלפון: $phone\n";
if ($city)    $body .= "עיר/אזור: $city\n";
if ($message) $body .= "הודעה: $message\n";
if ($page)    $body .= "\nמהעמוד: $page\n";
$body .= "\n- נשלח אוטומטית מטופס יצירת הקשר.";

$headers  = "From: נוגה אלומיניום <$FROM>\r\n";
$headers .= "Reply-To: $name <$FROM>\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

$sent = @mail($TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);
back($sent);
