const fs = require('fs');
const path = require('path');

const template = `"use client";
import { useState, useEffect } from 'react';
import { Loader2, Activity } from 'lucide-react';

export default function GenericGeneratedPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetch for placeholder
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh] cursor-default">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Module Under Construction</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">This section is currently being developed.</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-background shadow-neu rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center border-0 min-h-[400px]">
          <div className="w-20 h-20 bg-background shadow-neu-inset rounded-[2rem] flex items-center justify-center mb-6 text-primary">
             <Activity size={32} />
          </div>
          <h3 className="text-xl font-black text-foreground mb-2">Coming Soon</h3>
          <p className="text-sm font-bold text-muted-foreground max-w-md">
            This module has been scaffolded but the views and data connections are still being built out.
          </p>
        </div>
      </div>
    </div>
  );
}
`;

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walkDir(file));
    } else {
      if (file.endsWith('page.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const srcDir = path.join(__dirname, 'src', 'app', 'super-admin');
const files = walkDir(srcDir);

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('export default function GenericGeneratedPage')) {
    console.log('Updating:', file);
    fs.writeFileSync(file, template, 'utf8');
  }
});
