
import React, { useState } from 'react';
import type { Color } from '../types';

interface ColorSwatchProps {
  color: Color;
}

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 0 1-2.25 2.25H9.75A2.25 2.25 0 0 1 7.5 4.5v0a2.25 2.25 0 0 1 2.25-2.25h3.75c.621 0 1.155.318 1.484.814Zm-9 6.062a2.25 2.25 0 0 0-2.25 2.25v5.25a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-5.25a2.25 2.25 0 0 0-2.25-2.25h-9Z" />
  </svg>
);


export const ColorSwatch: React.FC<ColorSwatchProps> = ({ color }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(color.hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // A necessary exception to the "no inline styles" rule, as there's no other
  // way to render a dynamic color from an API response with Tailwind CSS.
  const swatchStyle = { backgroundColor: color.hex };

  return (
    <div className="flex items-start space-x-4 p-4 bg-gray-800/50 rounded-lg transition-all duration-300 hover:bg-gray-700/50">
      <div
        className="w-16 h-16 rounded-md border-2 border-gray-600 flex-shrink-0"
        style={swatchStyle}
      ></div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-white">{color.name}</h3>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-2 px-3 py-1 bg-gray-700 text-gray-300 rounded-md hover:bg-indigo-600 hover:text-white transition-colors text-sm"
            aria-label={`Copy hex code ${color.hex}`}
          >
            <span className="font-mono">{color.hex}</span>
            {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-gray-400 font-mono text-xs mt-1">{color.rgb}</p>
        <p className="text-gray-400 mt-1 text-sm">{color.description}</p>
      </div>
    </div>
  );
};