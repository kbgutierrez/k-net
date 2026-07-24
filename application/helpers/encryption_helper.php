<?php
(defined('BASEPATH')) or exit('No direct script access allowed');

if (!function_exists('bank_account_get_enc_key')) {
    // getenv() is unreliable under this app's PHP/IIS setup (same issue
    // GROQ_API_KEY hit) — constants.php defines a PHP constant straight
    // from $_ENV at bootstrap, which is the value that's actually reliable
    // here. getenv() is kept only as a last-resort fallback.
    function bank_account_get_enc_key()
    {
        $raw = defined('BANK_ACCOUNT_ENC_KEY') ? BANK_ACCOUNT_ENC_KEY : '';
        if ($raw === '') {
            $raw = (string) getenv('BANK_ACCOUNT_ENC_KEY');
        }
        return base64_decode($raw);
    }
}

if (!function_exists('bank_account_encrypt')) {
    function bank_account_encrypt($plaintext)
    {
        $key = bank_account_get_enc_key();
        if (strlen($key) !== 32) {
            throw new \RuntimeException('BANK_ACCOUNT_ENC_KEY is missing or invalid.');
        }

        $iv = random_bytes(12);
        $tag = '';
        $ciphertext = openssl_encrypt((string) $plaintext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag, '', 16);
        if ($ciphertext === false) {
            throw new \RuntimeException('Failed to encrypt account number.');
        }

        return base64_encode($iv . $tag . $ciphertext);
    }
}

if (!function_exists('bank_account_decrypt')) {
    function bank_account_decrypt($encoded)
    {
        $key = bank_account_get_enc_key();
        if (strlen($key) !== 32) {
            throw new \RuntimeException('BANK_ACCOUNT_ENC_KEY is missing or invalid.');
        }

        $raw = base64_decode((string) $encoded);
        if ($raw === false || strlen($raw) < 29) {
            return '';
        }

        $iv = substr($raw, 0, 12);
        $tag = substr($raw, 12, 16);
        $ciphertext = substr($raw, 28);

        $plaintext = openssl_decrypt($ciphertext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
        return $plaintext === false ? '' : $plaintext;
    }
}

if (!function_exists('bank_account_mask')) {
    function bank_account_mask($plaintext)
    {
        $plaintext = (string) $plaintext;
        $len = strlen($plaintext);
        if ($len === 0) {
            return '';
        }
        if ($len <= 4) {
            return str_repeat('*', $len);
        }

        return str_repeat('*', $len - 4) . substr($plaintext, -4);
    }
}
