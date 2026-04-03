<?php
/**
 * Out West Glow Golf — Contact Form Handler
 *
 * Accepts POST from the contact form, validates input,
 * checks honeypot, and sends an email to the site owner.
 * The recipient email is ONLY stored server-side here,
 * never exposed in the HTML or JavaScript.
 *
 * Returns JSON: { "success": true/false, "message": "..." }
 */

// ── Configuration ─────────────────────────────────────────────
define('RECIPIENT_EMAIL', 'jeff@outwestglowgolf.com');
define('SITE_NAME',       'Out West Glow Golf');
define('FROM_EMAIL',      'noreply@outwestglowgolf.com');
define('RATE_LIMIT_FILE', sys_get_temp_dir() . '/owgg_rl_' . md5($_SERVER['REMOTE_ADDR']));
define('RATE_LIMIT_SECS', 60); // One submission per IP per minute

// ── Headers ───────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// ── Rate limiting ──────────────────────────────────────────────
if (file_exists(RATE_LIMIT_FILE)) {
    $lastTime = (int)file_get_contents(RATE_LIMIT_FILE);
    if ((time() - $lastTime) < RATE_LIMIT_SECS) {
        http_response_code(429);
        echo json_encode(['success' => false, 'message' => 'Please wait a moment before sending another message.']);
        exit;
    }
}

// ── Honeypot check ─────────────────────────────────────────────
// The "website" field is hidden from humans but bots fill it in.
if (!empty($_POST['website'])) {
    // Silently appear to succeed so bots don't retry
    echo json_encode(['success' => true, 'message' => 'Thank you! Your message has been sent.']);
    exit;
}

// ── Input sanitization & validation ───────────────────────────
function clean(string $val): string {
    return htmlspecialchars(strip_tags(trim($val)), ENT_QUOTES, 'UTF-8');
}

$name    = clean($_POST['name']    ?? '');
$email   = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$phone   = clean($_POST['phone']   ?? '');
$subject = clean($_POST['subject'] ?? 'General Inquiry');
$message = clean($_POST['message'] ?? '');

$errors = [];
if (strlen($name) < 2)     $errors[] = 'Please enter your name.';
if (!$email)               $errors[] = 'Please enter a valid email address.';
if (strlen($message) < 10) $errors[] = 'Please enter a message (at least 10 characters).';

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// ── Build email ────────────────────────────────────────────────
$emailSubject = '[' . SITE_NAME . '] ' . $subject . ' — from ' . $name;

$body  = "New contact form submission from " . SITE_NAME . "\n";
$body .= str_repeat('-', 50) . "\n\n";
$body .= "Name:    {$name}\n";
$body .= "Email:   {$email}\n";
$body .= "Phone:   " . ($phone ?: '(not provided)') . "\n";
$body .= "Subject: {$subject}\n\n";
$body .= "Message:\n{$message}\n\n";
$body .= str_repeat('-', 50) . "\n";
$body .= "Submitted: " . date('Y-m-d H:i:s T') . "\n";
$body .= "IP:        " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

$headers  = "From: " . SITE_NAME . " <" . FROM_EMAIL . ">\r\n";
$headers .= "Reply-To: {$name} <{$email}>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . PHP_VERSION . "\r\n";

// ── Send ───────────────────────────────────────────────────────
$sent = mail(RECIPIENT_EMAIL, $emailSubject, $body, $headers);

if ($sent) {
    // Record time for rate limiting
    file_put_contents(RATE_LIMIT_FILE, time());

    echo json_encode([
        'success' => true,
        'message' => "Thanks, {$name}! Your message has been sent. We'll be in touch soon.",
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'There was a problem sending your message. Please try calling us directly.',
    ]);
}
