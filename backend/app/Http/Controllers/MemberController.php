<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class MemberController extends Controller
{
    // Return id and name of all associate group leaders
    public function index()
    {
        return User::where('role', 'associate_group_leader')->get(['id', 'name']);
    }
}
