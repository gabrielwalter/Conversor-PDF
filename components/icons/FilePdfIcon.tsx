import React from 'react';

const FilePdfIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M10 12h1" />
    <path d="M13 12h1" />
    <path d="M10 15.5h4" />
    <path d="M12.25 12C12.25 11.17 12.1 10.5 11.5 10.5c-.67 0-.75.67-.75 1.5v1c0 .83.08 1.5.75 1.5.6 0 .75-.67.75-1.5" />
    <path d="M15.25 15.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z" />
  </svg>
);

export default FilePdfIcon;
