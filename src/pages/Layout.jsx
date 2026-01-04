
import React from 'react';
import { Toaster } from "sonner";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-black">
      <style>{`
        :root {
          --background: 0 0% 0%;
          --foreground: 0 0% 100%;
          --card: 240 5% 10%;
          --card-foreground: 0 0% 100%;
          --popover: 240 5% 10%;
          --popover-foreground: 0 0% 100%;
          --primary: 160 84% 39%;
          --primary-foreground: 0 0% 0%;
          --secondary: 240 5% 15%;
          --secondary-foreground: 0 0% 100%;
          --muted: 240 5% 20%;
          --muted-foreground: 240 5% 65%;
          --accent: 240 5% 15%;
          --accent-foreground: 0 0% 100%;
          --destructive: 0 84% 60%;
          --destructive-foreground: 0 0% 100%;
          --border: 240 5% 20%;
          --input: 240 5% 20%;
          --ring: 160 84% 39%;
        }
        
        body {
          background: #000;
          color: #fff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#18181b',
            border: '1px solid #27272a',
            color: '#fff'
          }
        }}
      />
      <main className="max-w-lg mx-auto">
        {children}
      </main>
    </div>
  );
}
