<?php

namespace App\Exports;

class VolunteerTemplateExport
{
    /**
     * Get the template data for volunteer import
     * Returns array with headers and sample data
     */
    public function get()
    {
        return [
            ['Name', 'Gender', 'Contact Info', 'Address', 'Expertise'],
            ['John Doe', 'Male', '09123456789', '123 Main St, Quezon City', 'Medical'],
            ['Jane Smith', 'Female', '09876543210', '456 Oak Ave, Manila', 'Logistics'],
            ['Mike Johnson', 'Male', '09111222333', '789 Pine Rd, Makati', 'Communication']
        ];
    }
}
