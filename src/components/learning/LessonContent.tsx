import React from 'react';
import ReactMarkdown from 'react-markdown';
import {Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import Image from 'next/image';

interface LessonContentProps {
  content?: string; // Make content optional
}

// Updated CodeProps to make node optional and match ReactMarkdown's expected types
interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const LessonContent: React.FC<LessonContentProps> = ({content = ''}) => {
  // Provide a default empty string
  return (
    <div className="prose prose-lg max-w-none">
      {content ? (
        <ReactMarkdown
          components={{
            h1: ({node, ...props }) => <h1 className="text-3xl font-bold mb-6 text-neutral-900" {...props} />,
            h2: ({node, ...props }) => <h2 className="text-2xl font-bold mt-8 mb-4 text-neutral-900" {...props} />,
            h3: ({node, ...props }) => <h3 className="text-xl font-bold mt-6 mb-3 text-neutral-900" {...props} />,
            p: ({node, ...props }) => <p className="mb-4 text-neutral-800 leading-relaxed" {...props} />,
            ul: ({node, ...props }) => <ul className="list-disc pl-6 mb-6 space-y-2" {...props} />,
            ol: ({node, ...props }) => <ol className="list-decimal pl-6 mb-6 space-y-2" {...props} />,
            li: ({node, ...props }) => <li className="text-neutral-800" {...props} />,
            a: ({node, ...props }) => (
              <a 
                className="text-primary hover:text-primary-700 underline transition-colors" 
                target="_blank"
                rel="noopener noreferrer"
                {...props} 
              />
            ),
            blockquote: ({node, ...props }) => (
              <blockquote className="border-l-4 border-primary-200 pl-4 py-2 my-4 bg-primary-50 rounded-r-md" {...props} />
            ),
            img: ({src, alt }) => (
              <div className="my-6">
                <Image 
                  src={src || ''} 
                  alt={alt || ''} 
                  width={'800'} 
                  height={'450'} 
                  className="rounded-lg shadow-md" 
                />
                {alt && <p className="text-sm text-neutral-500 mt-2 text-center">{alt}</p>}
              </div>
            ),
            code: ({inline, className, children, ...props }: CodeProps) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <div className="my-6 rounded-lg overflow-hidden">
                  <SyntaxHighlighter
                    style={tomorrow}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
          },
            table: ({node, ...props }) => (
              <div className="overflow-x-auto my-6">
                <table className="min-w-full divide-y divide-neutral-200 border border-neutral-200 rounded-lg" {...props} />
              </div>
            ),
            thead: ({node, ...props }) => <thead className="bg-neutral-50" {...props} />,
            th: ({node, ...props }) => (
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider" 
                {...props} 
              />
            ),
            td: ({node, ...props }) => <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800" {...props} />,
            hr: ({node, ...props }) => <hr className="my-8 border-neutral-200" {...props} />,
        }}
        >
          {content}
        </ReactMarkdown>
      ) : (
        <p className="text-neutral-500">No content available for this lesson.</p>
      )}
    </div>
  );
};

export default LessonContent;



