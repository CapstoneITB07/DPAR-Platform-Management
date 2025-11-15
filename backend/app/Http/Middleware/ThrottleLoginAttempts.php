<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Exceptions\ThrottleRequestsException;

class ThrottleLoginAttempts
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next, $maxAttempts = 5, $decayMinutes = 10)
    {
        $key = $this->resolveRequestSignature($request);

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);

            throw new ThrottleRequestsException(
                "Too many login attempts. Please try again in {$seconds} seconds.",
                null,
                $this->getHeaders($maxAttempts, $seconds)
            );
        }

        RateLimiter::hit($key, $decayMinutes * 60);

        $response = $next($request);

        // Clear rate limiter on successful login
        if ($response->getStatusCode() === 200 && $request->is('api/login')) {
            $responseData = json_decode($response->getContent(), true);
            if (isset($responseData['token'])) {
                RateLimiter::clear($key);
            }
        }

        return $response;
    }

    /**
     * Resolve request signature for rate limiting.
     * Use username instead of IP for user-based limiting.
     */
    protected function resolveRequestSignature(Request $request)
    {
        $username = $request->input('username');
        return 'login_attempts:' . sha1($username ?? $request->ip());
    }

    /**
     * Get the rate limiting headers.
     */
    protected function getHeaders($maxAttempts, $remainingAttempts, $retryAfter = null)
    {
        $headers = [
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => $remainingAttempts,
        ];

        if (!is_null($retryAfter)) {
            $headers['Retry-After'] = $retryAfter;
            $headers['X-RateLimit-Reset'] = now()->addSeconds($retryAfter)->getTimestamp();
        }

        return $headers;
    }
}
