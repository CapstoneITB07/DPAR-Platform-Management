<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TrainingProgram;
use Illuminate\Support\Facades\Storage;

class TrainingProgramController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $programs = TrainingProgram::orderBy('created_at', 'desc')->get();
        foreach ($programs as $p) {
            $p->image_url = $p->image_path ? asset('storage/' . $p->image_path) : null;
        }
        return $programs;
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'date' => 'required|date',
            'location' => 'required|string|max:255',
            'description' => 'required|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $data = $request->only(['name', 'date', 'location', 'description']);
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('training_programs', 'public');
            $data['image_path'] = $path;
        }

        $program = TrainingProgram::create($data);
        $program->image_url = $program->image_path ? asset('storage/' . $program->image_path) : null;
        return response()->json($program, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $program = TrainingProgram::findOrFail($id);
        $request->validate([
            'name' => 'required|string|max:255',
            'date' => 'required|date',
            'location' => 'required|string|max:255',
            'description' => 'required|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
        if ($request->hasFile('image')) {
            if ($program->image_path && Storage::disk('public')->exists($program->image_path)) {
                Storage::disk('public')->delete($program->image_path);
            }
            $program->image_path = $request->file('image')->store('training_programs', 'public');
        }
        $program->name = $request->input('name');
        $program->date = $request->input('date');
        $program->location = $request->input('location');
        $program->description = $request->input('description');
        $program->save();
        $program->image_url = $program->image_path ? asset('storage/' . $program->image_path) : null;
        return response()->json($program);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $program = TrainingProgram::findOrFail($id);
        if ($program->image_path && Storage::disk('public')->exists($program->image_path)) {
            Storage::disk('public')->delete($program->image_path);
        }
        $program->delete();
        return response()->json(['message' => 'Training program deleted.']);
    }
}
