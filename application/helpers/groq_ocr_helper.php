<?php
if (!defined('BASEPATH')) exit('No direct script access allowed');

if (!function_exists('groq_ocr_extract')) {
    function groq_ocr_extract($imageDataUrl, $prompt, $apiKey, array $context = array())
    {
        $candidates = _groq_ocr_candidate_models();

        $cached = _groq_ocr_get_cached_model();
        if ($cached !== '' && in_array($cached, $candidates, true)) {
            $candidates = array_values(array_unique(array_merge(array($cached), $candidates)));
        }

        $attempts = array();

        foreach ($candidates as $model) {
            $attempt = _groq_ocr_call_api($model, $imageDataUrl, $prompt, $apiKey);
            $attempts[] = array(
                'model' => $model,
                'http_code' => $attempt['http_code'],
                'curl_error' => $attempt['curl_error'],
                'provider_error' => $attempt['provider_error'],
            );

            if ($attempt['success']) {
                _groq_ocr_set_cached_model($model);
                _groq_ocr_log($context, $attempts, $model, true);

                return array(
                    'ok' => true,
                    'content' => $attempt['content'],
                    'model' => $model,
                );
            }

            if (!$attempt['retry_next_model']) {
                break;
            }
        }

        _groq_ocr_log($context, $attempts, null, false);

        return array(
            'ok' => false,
            'user_message' => _groq_ocr_user_message($attempts),
        );
    }
}

if (!function_exists('_groq_ocr_candidate_models')) {
    function _groq_ocr_candidate_models()
    {
        return array(
            'qwen/qwen3.6-27b',
            'openai/gpt-oss-120b',
            'meta-llama/llama-4-scout-17b-16e-instruct',
            'meta-llama/llama-4-maverick-17b-128e-instruct',
        );
    }
}

if (!function_exists('_groq_ocr_cache_path')) {
    function _groq_ocr_cache_path()
    {
        return APPPATH . 'cache/groq_ocr_active_model.json';
    }
}

if (!function_exists('_groq_ocr_get_cached_model')) {
    function _groq_ocr_get_cached_model()
    {
        $path = _groq_ocr_cache_path();
        if (!is_file($path)) {
            return '';
        }

        $raw = @file_get_contents($path);
        if ($raw === false || $raw === '') {
            return '';
        }

        $data = json_decode($raw, true);
        return is_array($data) && !empty($data['model']) ? (string) $data['model'] : '';
    }
}

if (!function_exists('_groq_ocr_set_cached_model')) {
    function _groq_ocr_set_cached_model($model)
    {
        @file_put_contents(_groq_ocr_cache_path(), json_encode(array(
            'model' => $model,
            'updated_at' => date('Y-m-d H:i:s'),
        )));
    }
}

if (!function_exists('_groq_ocr_call_api')) {
    function _groq_ocr_call_api($model, $imageDataUrl, $prompt, $apiKey)
    {
        $payload = array(
            'model' => $model,
            'temperature' => 0.2,
            'max_completion_tokens' => 1000,
            'top_p' => 1,
            'stream' => false,
            'messages' => array(
                array(
                    'role' => 'user',
                    'content' => array(
                        array('type' => 'text', 'text' => $prompt),
                        array('type' => 'image_url', 'image_url' => array('url' => $imageDataUrl)),
                    ),
                ),
            ),
        );

        if (strpos($model, 'qwen/') === 0) {
            $payload['reasoning_effort'] = 'none';
            $payload['reasoning_format'] = 'hidden';
            $payload['max_completion_tokens'] = 1024;
        }

        $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ));
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);

        $rawResponse = curl_exec($ch);
        $curlError = curl_error($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($rawResponse === false || $curlError) {
            return array(
                'success' => false,
                'http_code' => $httpCode,
                'curl_error' => $curlError,
                'provider_error' => null,
                'content' => '',
                'retry_next_model' => false,
            );
        }

        $response = json_decode($rawResponse, true);

        if (!is_array($response) || $httpCode >= 400) {
            $providerError = is_array($response) && isset($response['error']) ? $response['error'] : null;
            $errorCode = is_array($providerError) && isset($providerError['code']) ? strtolower((string) $providerError['code']) : '';
            $errorMessage = is_array($providerError) && isset($providerError['message']) ? strtolower((string) $providerError['message']) : '';

            $looksLikeModelProblem = strpos($errorCode, 'model') !== false
                || strpos($errorMessage, 'model') !== false
                || strpos($errorMessage, 'decommission') !== false;

            return array(
                'success' => false,
                'http_code' => $httpCode,
                'curl_error' => '',
                'provider_error' => $providerError,
                'content' => '',
                'retry_next_model' => $looksLikeModelProblem,
            );
        }

        $content = '';
        if (isset($response['choices'][0]['message']['content']) && is_string($response['choices'][0]['message']['content'])) {
            $content = $response['choices'][0]['message']['content'];
        }

        return array(
            'success' => true,
            'http_code' => $httpCode,
            'curl_error' => '',
            'provider_error' => null,
            'content' => $content,
            'retry_next_model' => false,
        );
    }
}

if (!function_exists('_groq_ocr_user_message')) {
    function _groq_ocr_user_message($attempts)
    {
        $lastAttempt = end($attempts);
        $httpCode = is_array($lastAttempt) ? (int) $lastAttempt['http_code'] : 0;

        if ($httpCode === 401 || $httpCode === 403) {
            return "Receipt scanning isn't available right now. Please enter the details manually — we've been notified.";
        }

        if ($httpCode === 429) {
            return "Receipt scanning is busy right now. Please try again in a moment, or enter the details manually.";
        }

        return "We couldn't read this receipt automatically. Please try again, or enter the details manually.";
    }
}

if (!function_exists('_groq_ocr_log')) {
    function _groq_ocr_log($context, $attempts, $successModel, $success)
    {
        $summary = array(
            'endpoint' => isset($context['endpoint']) ? $context['endpoint'] : '',
            'user_id' => isset($context['user_id']) ? $context['user_id'] : null,
            'success' => $success,
            'model_used' => $successModel,
            'attempts' => $attempts,
        );

        $level = $success ? 'info' : 'error';
        log_message($level, 'Groq OCR ' . ($success ? 'succeeded' : 'failed') . ': ' . json_encode($summary));
    }
}
