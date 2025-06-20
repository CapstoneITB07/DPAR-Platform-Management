<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\AssociateGroup;

class AssociateGroupSeeder extends Seeder
{
    public function run()
    {
        $leaders = User::where('role', 'associate_group_leader')->get();

        $logoMap = [
            'AKLMV' => 'AKLMV.png',
            'ALERT' => 'ALERT.png',
            'CCVOL' => 'CCVOL.png',
            'CRRG' => 'CRRG.png',
            'DRRM-Y' => 'DRRM - Y.png',
            'FRONTLINER' => 'FRONTLINER.png',
            'JKM' => 'JKM.png',
            'KAIC' => 'KAIC.png',
            'MRAP' => 'MRAP.png',
            'MSG-ERU' => 'MSG - ERU.png',
            'PCGA 107th' => 'PCGA 107th.png',
            'RMFB' => 'RMFB.png',
            'SPAG' => 'SPAG.png',
            'SRG' => 'SRG.png',
            'TF' => 'TF.png',
        ];

        foreach ($leaders as $user) {
            $logoFile = $logoMap[$user->organization] ?? 'disaster_logo.png';
            AssociateGroup::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'name' => $user->organization,
                    'type' => 'Organization',
                    'director' => $user->name,
                    'description' => 'Default description for ' . $user->organization,
                    'logo' => '/Assets/' . $logoFile,
                    'email' => $user->email,
                    'phone' => 'N/A',
                ]
            );
        }
    }
}
