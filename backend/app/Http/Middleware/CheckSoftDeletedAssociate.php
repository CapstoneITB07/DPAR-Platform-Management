<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\AssociateGroup;
use App\Models\User;

class CheckSoftDeletedAssociate
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        // Only check for associate group leaders
        if (Auth::check() && Auth::user()->role === 'associate_group_leader') {
            /** @var User $user */
            $user = Auth::user();

            // Check if the user's associate group has been soft deleted
            $associateGroup = AssociateGroup::withTrashed()
                ->where('user_id', $user->id)
                ->first();

            if ($associateGroup && $associateGroup->trashed()) {
                // Revoke all tokens for this user
                $user->tokens()->delete();

                // Return 401 response (Unauthorized)
                return response()->json([
                    'message' => 'Invalid account. Contact the administrator.',
                    'error' => 'Invalid account'
                ], 401);
            }
        }

        return $next($request);
    }
}
