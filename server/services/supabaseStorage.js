const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://kkhrghngknvkilbpeagw.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtraHJnaG5na252a2lsYnBlYWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMzU2NDksImV4cCI6MjA5MDcxMTY0OX0.9qQ9wMnZKRbGNZ99bx9XVz68pWmwUbZWb9OYyAad-ZQ';

const supabase = createClient(supabaseUrl, supabaseKey);

const uploadFile = async (file, folder = 'grievances') => {
    try {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 100000)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('grievances')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('grievances')
            .getPublicUrl(filePath);

        return {
            name: file.originalname,
            path: publicUrl,
            mimeType: file.mimetype,
            size: file.size
        };
    } catch (err) {
        console.error('Supabase Storage Upload Error:', err.message);
        throw err;
    }
};

module.exports = { uploadFile, supabase };
