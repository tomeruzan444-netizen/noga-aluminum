<?php
/**
 * Noga Aluminum - contact form handler.
 * Emails leads to the business. Returns JSON for AJAX submits, redirects otherwise.
 */

$TO   = 'tomeruzan444@gmail.com';
$FROM = 'no-reply@noga-aluminum.co.il';

$isAjax = (strtolower($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'xmlhttprequest');

function respond($ok) {
  global $isAjax;
  if ($isAjax) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($ok ? 200 : 400);
    echo json_encode(['ok' => $ok]);
  } else {
    $ref = $_SERVER['HTTP_REFERER'] ?? '/';
    $sep = (strpos($ref, '?') === false) ? '?' : '&';
    header('Location: ' . $ref . $sep . ($ok ? 'sent=1' : 'error=1') . '#main');
  }
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); respond(false); }

// Honeypot - bots fill this hidden field.
if (!empty($_POST['website'])) { respond(true); }

$name    = trim($_POST['name'] ?? '');
$phone   = trim($_POST['phone'] ?? '');
$city    = trim($_POST['city'] ?? '');
$message = trim($_POST['message'] ?? '');
$page    = trim($_POST['page'] ?? '');

if ($name === '' || $phone === '') { respond(false); }

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
$body .= "\n- נשלח אוטומטית מטופס יצירת הקשר באתר.";

$headers  = "From: נוגה אלומיניום <$FROM>\r\n";
$headers .= "Reply-To: $FROM\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

$sent = @mail($TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);
respond($sent);
