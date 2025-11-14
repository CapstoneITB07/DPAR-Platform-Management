<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'throttle.login' => \App\Http\Middleware\ThrottleLoginAttempts::class,
        ]);
        
        // Exclude all superadmin routes, system alerts, and citizen routes from maintenance mode
        // This allows superadmin to access everything during maintenance to disable it
        // Citizen routes are excluded so citizen pages can work offline
        $middleware->preventRequestsDuringMaintenance(
            except: [
                '/api/superadmin/*',
                '/api/superadmin',
                'api/superadmin/*',
                'api/superadmin',
                '/api/system-alerts/active',
                'api/system-alerts/active',
                '/api/citizen/*',
                'api/citizen/*'
            ]
        );
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
