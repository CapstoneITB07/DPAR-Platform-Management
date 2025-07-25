<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // For API requests, return null to prevent redirect and let the parent handle it
        if ($request->expectsJson()) {
            return null;
        }
        
        // For web requests, redirect to login (though we don't have web routes)
        return route('login');
    }

    /**
     * Handle an unauthenticated user.
     */
    protected function unauthenticated($request, array $guards)
    {
        if ($request->expectsJson()) {
            abort(response()->json(['error' => 'Unauthenticated.'], 401));
        }

        parent::unauthenticated($request, $guards);
    }
} 