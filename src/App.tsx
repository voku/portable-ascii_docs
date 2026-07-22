/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { 
  Copy, Check, Terminal, Shield, Zap, Globe, FileText, 
  Code, Cpu, ExternalLink, Lock, Info, CheckCircle, 
  Layers, BookOpen, AlertTriangle, ChevronDown, ChevronUp, ArrowUpRight,
  Menu, X
} from 'lucide-react';

interface CodeSnippet {
  title: string;
  methodName: string;
  description: string;
  code: string;
}

const COMMON_OPERATIONS: Record<string, CodeSnippet> = {
  to_ascii: {
    title: "Convert to ASCII",
    methodName: "ASCII::to_ascii()",
    description: "Converts supported characters using deterministic language-specific replacement maps. Unsupported characters are removed by default. Enable $use_transliterate or call ASCII::to_transliterate() when broader fallback transliteration is required.",
    code: `<?php

declare(strict_types=1);

use voku\\helper\\ASCII;

// Default ASCII conversion
echo ASCII::to_ascii('déjà σσς iıii');
// Output: "deja sss iiii"

// Language-specific rules are preserved
echo ASCII::to_ascii('Düsseldorf', 'de');
// Output: "Duesseldorf"`
  },
  to_slugify: {
    title: "Generate URL Slugs",
    methodName: "ASCII::to_slugify()",
    description: "Build clean, search-engine-friendly URL path segments with customizable separators and language context support.",
    code: `<?php

declare(strict_types=1);

use voku\\helper\\ASCII;

// Generate language-aware URL slugs
echo ASCII::to_slugify('Fußgängerübergänge in Düsseldorf', '-', 'de');
// Output: "fussgaengeruebergaenge-in-duesseldorf"`
  },
  to_filename: {
    title: "Filesystem Filenames",
    methodName: "ASCII::to_filename()",
    description: "Creates a restricted ASCII filename candidate. Applications must still enforce platform-specific reserved names, allowed extensions, maximum length, collision handling, and storage-path policy.",
    code: `<?php

declare(strict_types=1);

use voku\\helper\\ASCII;

// Normalize to restricted, non-problematic ASCII characters with a custom fallback
echo ASCII::to_filename('שדгשדг.png');
// Output: "shdgshdg.png"`
  },
  normalize_msword: {
    title: "Normalize MS Word Text",
    methodName: "ASCII::normalize_msword()",
    description: "Automatically convert smart double/single quotes, ellipses, en-dashes, and non-breaking spaces into clean ASCII symbols.",
    code: `<?php

declare(strict_types=1);

use voku\\helper\\ASCII;

$input = '„Abcdef…” — Smart Quotes and ellipsis';

echo ASCII::normalize_msword($input);
// Output: '"Abcdef..." - Smart Quotes and ellipsis'`
  },
  remove_invisible: {
    title: "Remove Invisible Characters",
    methodName: "ASCII::remove_invisible_characters()",
    description: "Removes null bytes and selected ASCII control characters by default. Pass $keep_basic_control_characters = false for broader Unicode control and format-character cleanup, and $url_encoded = true to process encoded control bytes such as %00.",
    code: `<?php

declare(strict_types=1);

use voku\\helper\\ASCII;

// Standard control/NULL character removal
echo ASCII::remove_invisible_characters("Java\\0script");
// Output: "Javascript"

// Target Unicode control-format characters specifically with safety validation
$input = json_decode(
    '"Java\\u200Bscript\\u200C"',
    true,
    512,
    JSON_THROW_ON_ERROR
);

if (!\\is_string($input)) {
    throw new \\UnexpectedValueException('Expected decoded JSON string.');
}

echo ASCII::remove_invisible_characters($input, false, '', false);
// Output: "Javascript"`
  }
};

interface ApiReferenceRow {
  name: string;
  signature: string;
  purpose: string;
  parameters: { name: string; type: string; desc: string }[];
}

const API_REFERENCE: ApiReferenceRow[] = [
  {
    name: "to_ascii",
    signature: "ASCII::to_ascii(string $str, string $language = 'en', bool $remove_unsupported_chars = true, bool $replace_extra_symbols = false, bool $use_transliterate = false, bool $replace_single_chars_only = false): string",
    purpose: "Converts non-ASCII input to ASCII using optional language-specific replacements.",
    parameters: [
      { name: "$str", type: "string", desc: "The input string to be transliterated." },
      { name: "$language", type: "string", desc: "Target language context (e.g. 'de', 'fr', 'tr', 'ru')." },
      { name: "$remove_unsupported_chars", type: "bool", desc: "If true, non-transliteratable chars are stripped." },
      { name: "$replace_extra_symbols", type: "bool", desc: "Whether to convert extra symbols like punctuation, currencies, etc." },
      { name: "$use_transliterate", type: "bool", desc: "Option to force PHP's native Transliterator class if available." },
      { name: "$replace_single_chars_only", type: "bool", desc: "Restrict rules to single characters only instead of multi-byte sequences." }
    ]
  },
  {
    name: "to_slugify",
    signature: "ASCII::to_slugify(string $str, string $separator = '-', string $language = 'en', array $replacements = [], bool $replace_extra_symbols = false, bool $use_str_to_lower = true, bool $use_transliterate = false): string",
    purpose: "Creates clean URL-friendly paths and slug identifiers.",
    parameters: [
      { name: "$str", type: "string", desc: "The source string." },
      { name: "$separator", type: "string", desc: "The punctuation glue character (defaults to '-')." },
      { name: "$language", type: "string", desc: "Language code for specific vowels and character sets." },
      { name: "$replacements", type: "array", desc: "Custom search-and-replace pairs." },
      { name: "$replace_extra_symbols", type: "bool", desc: "Whether to convert extra typographic symbols." },
      { name: "$use_str_to_lower", type: "bool", desc: "Convert string to lowercase automatically." },
      { name: "$use_transliterate", type: "bool", desc: "Option to force PHP's native Transliterator class." }
    ]
  },
  {
    name: "to_filename",
    signature: "ASCII::to_filename(string $str, bool $use_transliterate = true, string $fallback_char = '-'): string",
    purpose: "Creates a restricted ASCII filename candidate. Applications must still enforce platform-specific reserved names, allowed extensions, maximum length, collision handling, and storage-path policy.",
    parameters: [
      { name: "$str", type: "string", desc: "Input name or title." },
      { name: "$use_transliterate", type: "bool", desc: "Whether to run standard transliterations first." },
      { name: "$fallback_char", type: "string", desc: "Character used to replace forbidden filesystem elements (defaults to '-')." }
    ]
  },
  {
    name: "clean",
    signature: "ASCII::clean(string $str, bool $normalize_whitespace = true, bool $keep_non_breaking_space = false, bool $normalize_msword = true, bool $remove_invisible_characters = true, bool $remove_invalid_utf8 = true): string",
    purpose: "Removes malformed UTF-8 sequences by default and optionally normalizes whitespace, MS Word typography, and invisible characters.",
    parameters: [
      { name: "$str", type: "string", desc: "Input string with potentially corrupted UTF-8 codepoints." },
      { name: "$normalize_whitespace", type: "bool", desc: "Whether to normalize whitespace characters." },
      { name: "$keep_non_breaking_space", type: "bool", desc: "Keep or convert non-breaking spaces." },
      { name: "$normalize_msword", type: "bool", desc: "Whether to normalize MS Word typography characters." },
      { name: "$remove_invisible_characters", type: "bool", desc: "Whether to purge unprintable/invisible characters." },
      { name: "$remove_invalid_utf8", type: "bool", desc: "Whether to clean invalid UTF-8 byte sequences." }
    ]
  },
  {
    name: "normalize_msword",
    signature: "ASCII::normalize_msword(string $str): string",
    purpose: "Converts copy-pasted MS Word smart quotes, ellipses, dashes, and other typographic characters to standard plain characters.",
    parameters: [
      { name: "$str", type: "string", desc: "The text block to normalize." }
    ]
  },
  {
    name: "remove_invisible_characters",
    signature: "ASCII::remove_invisible_characters(string $str, bool $url_encoded = false, string $replacement = '', bool $keep_basic_control_characters = true): string",
    purpose: "Removes null bytes and selected ASCII control characters by default. Pass $keep_basic_control_characters = false for broader Unicode control and format-character cleanup, and $url_encoded = true to process encoded control bytes such as %00.",
    parameters: [
      { name: "$str", type: "string", desc: "Input string." },
      { name: "$url_encoded", type: "bool", desc: "If true, handles double-encoded url characters." },
      { name: "$replacement", type: "string", desc: "Alternative string to replace invisible characters with." },
      { name: "$keep_basic_control_characters", type: "bool", desc: "If false, strips even basic formatting keys like tabs and newlines." }
    ]
  },
  {
    name: "is_ascii",
    signature: "ASCII::is_ascii(string $str): bool",
    purpose: "Checks whether the string contains only 7-bit ASCII bytes.",
    parameters: [
      { name: "$str", type: "string", desc: "String to verify." }
    ]
  },
  {
    name: "normalize_whitespace",
    signature: "ASCII::normalize_whitespace(string $str, bool $keepNonBreakingSpace = false, bool $keepBidiUnicodeControls = false, bool $normalize_control_characters = false): string",
    purpose: "Normalizes known typographic whitespace characters to regular standard spaces.",
    parameters: [
      { name: "$str", type: "string", desc: "Input string containing non-standard or mixed spacing elements." },
      { name: "$keepNonBreakingSpace", type: "bool", desc: "Whether to keep non-breaking spaces untouched." },
      { name: "$keepBidiUnicodeControls", type: "bool", desc: "Whether to keep bidirectional text control characters." },
      { name: "$normalize_control_characters", type: "bool", desc: "Whether to normalize other spacing control characters." }
    ]
  }
];

interface Token {
  type: 'comment' | 'string' | 'keyword' | 'number' | 'variable' | 'class' | 'method' | 'operator' | 'text';
  text: string;
}

function tokenizePhp(code: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  const length = code.length;

  while (index < length) {
    const remaining = code.substring(index);

    // 1. Comments: single line starting with //
    const commentMatch = remaining.match(/^\/\/[^\r\n]*/);
    if (commentMatch) {
      tokens.push({ type: 'comment', text: commentMatch[0] });
      index += commentMatch[0].length;
      continue;
    }

    // 2. PHP tags: <?php
    const tagMatch = remaining.match(/^<\?php/);
    if (tagMatch) {
      tokens.push({ type: 'keyword', text: tagMatch[0] });
      index += tagMatch[0].length;
      continue;
    }

    // 3. Strings: single quotes with escaped chars
    const singleQuoteMatch = remaining.match(/^'([^'\\]|\\.)*'/);
    if (singleQuoteMatch) {
      tokens.push({ type: 'string', text: singleQuoteMatch[0] });
      index += singleQuoteMatch[0].length;
      continue;
    }

    // Double quotes with escaped chars
    const doubleQuoteMatch = remaining.match(/^"([^"\\]|\\.)*"/);
    if (doubleQuoteMatch) {
      tokens.push({ type: 'string', text: doubleQuoteMatch[0] });
      index += doubleQuoteMatch[0].length;
      continue;
    }

    // 4. Variables: starting with $
    const varMatch = remaining.match(/^\$[a-zA-Z_][a-zA-Z0-9_]*/);
    if (varMatch) {
      tokens.push({ type: 'variable', text: varMatch[0] });
      index += varMatch[0].length;
      continue;
    }

    // 5. Numbers
    const numMatch = remaining.match(/^\b\d+\b/);
    if (numMatch) {
      tokens.push({ type: 'number', text: numMatch[0] });
      index += numMatch[0].length;
      continue;
    }

    // 6. Keywords
    const keywordMatch = remaining.match(/^\b(declare|strict_types|use|echo|throw|new|if|false|true)\b/);
    if (keywordMatch) {
      tokens.push({ type: 'keyword', text: keywordMatch[0] });
      index += keywordMatch[0].length;
      continue;
    }

    // 7. Class names before double colon (e.g., ASCII::)
    const classMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(?=::)/);
    if (classMatch) {
      tokens.push({ type: 'class', text: classMatch[0] });
      index += classMatch[0].length;
      continue;
    }

    // 8. Methods/functions (e.g., ::to_ascii, to_ascii(), json_decode())
    const funcMatch = remaining.match(/^\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/);
    if (funcMatch) {
      tokens.push({ type: 'method', text: funcMatch[0] });
      index += funcMatch[0].length;
      continue;
    }

    // 9. Operators (including backslash as namespace sep)
    const operatorMatch = remaining.match(/^(\(|\||\)|\[|\]|\{|\}|,|;|::|=>|=|\!|\\)/);
    if (operatorMatch) {
      tokens.push({ type: 'operator', text: operatorMatch[0] });
      index += operatorMatch[0].length;
      continue;
    }

    // Fallback: take one character or any plain word
    const plainMatch = remaining.match(/^[a-zA-Z0-9_]+|^[^\S\r\n]+|^[\r\n]+|^./);
    if (plainMatch) {
      tokens.push({ type: 'text', text: plainMatch[0] });
      index += plainMatch[0].length;
      continue;
    }
  }

  return tokens;
}

function PhpCodeBlock({ code }: { code: string }) {
  const tokens = tokenizePhp(code);

  const getClassForType = (type: string) => {
    switch (type) {
      case 'comment':
        return 'text-slate-500 italic';
      case 'string':
        return 'text-emerald-400 font-medium';
      case 'variable':
        return 'text-teal-400 font-medium';
      case 'number':
        return 'text-amber-400 font-medium';
      case 'keyword':
        return 'text-rose-400 font-semibold';
      case 'class':
        return 'text-cyan-400 font-semibold';
      case 'method':
        return 'text-blue-400 font-medium';
      case 'operator':
        return 'text-slate-400';
      default:
        return 'text-slate-200';
    }
  };

  return (
    <pre className="font-mono text-xs select-all whitespace-pre leading-relaxed overflow-x-auto">
      <code>
        {tokens.map((token, idx) => (
          <span key={idx} className={getClassForType(token.type)}>
            {token.text}
          </span>
        ))}
      </code>
    </pre>
  );
}

export default function App() {
  const shouldReduceMotion = useReducedMotion();
  const initialAnimation = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 };
  const animateAnimation = shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 };
  const transitionAnimation = shouldReduceMotion ? { duration: 0.05 } : { duration: 0.2, ease: "easeOut" };

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('to_ascii');
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 120) {
        setActiveSection('');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const sections = ['about', 'common-ops', 'language-comparison', 'performance', 'api-reference'];
    const observers = sections.map(id => {
      const el = document.getElementById(id);
      if (!el) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        {
          rootMargin: '-20% 0px -50% 0px',
        }
      );
      observer.observe(el);
      return { observer, el };
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observers.forEach(obs => {
        if (obs) {
          obs.observer.unobserve(obs.el);
        }
      });
    };
  }, []);

  const triggerCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleExpandMethod = (name: string) => {
    if (expandedMethod === name) {
      setExpandedMethod(null);
    } else {
      setExpandedMethod(name);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 antialiased">
      
      {/* Document Metadata (React 19 native hoisting) */}
      <title>voku/Stringy - PHP ASCII & String Utility Helper</title>
      <meta name="description" content="A comprehensive, clean, and highly performant documentation hub for voku/Stringy — the industry-standard PHP ASCII & string normalization helper library." />
      
      {/* OpenGraph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content="voku/Stringy - PHP ASCII & String Utility Helper" />
      <meta property="og:description" content="A comprehensive, clean, and highly performant documentation hub for voku/Stringy — the industry-standard PHP ASCII & string normalization helper library." />
      <meta property="og:url" content="https://github.com/voku/Stringy" />
      <meta property="og:site_name" content="voku/Stringy" />
      <meta property="og:image" content="https://opengraph.githubassets.com/1/voku/Stringy" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="voku/Stringy - PHP ASCII & String Utility Helper" />
      <meta name="twitter:description" content="A comprehensive, clean, and highly performant documentation hub for voku/Stringy — the industry-standard PHP ASCII & string normalization helper library." />
      <meta name="twitter:image" content="https://opengraph.githubassets.com/1/voku/Stringy" />

      {/* Decorative Grid Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none" />

      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/95 border-b border-slate-200/85 shadow-xs" id="navigation">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-mono text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-0.5 truncate">
                voku<span className="text-slate-400 font-normal">/</span>portable-ascii
              </span>
              <p className="text-[8px] sm:text-[9px] text-slate-500 font-mono tracking-wider uppercase font-semibold truncate">PHP String Component</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1 lg:space-x-3 text-xs font-bold text-slate-600 tracking-wide uppercase">
            <a 
              href="#about" 
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 hover:text-indigo-650 hover:bg-slate-50/80 ${
                activeSection === 'about' ? 'text-indigo-600 bg-indigo-50/70 font-extrabold' : 'text-slate-600'
              }`}
            >
              Why Portable?
            </a>
            <a 
              href="#common-ops" 
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 hover:text-indigo-650 hover:bg-slate-50/80 ${
                activeSection === 'common-ops' ? 'text-indigo-600 bg-indigo-50/70 font-extrabold' : 'text-slate-600'
              }`}
            >
              PHP Examples
            </a>
            <a 
              href="#language-comparison" 
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 hover:text-indigo-650 hover:bg-slate-50/80 ${
                activeSection === 'language-comparison' ? 'text-indigo-600 bg-indigo-50/70 font-extrabold' : 'text-slate-600'
              }`}
            >
              Language Matrices
            </a>
            <a 
              href="#performance" 
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 hover:text-indigo-650 hover:bg-slate-50/80 ${
                activeSection === 'performance' ? 'text-indigo-600 bg-indigo-50/70 font-extrabold' : 'text-slate-600'
              }`}
            >
              Performance
            </a>
            <a 
              href="#api-reference" 
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 hover:text-indigo-650 hover:bg-slate-50/80 ${
                activeSection === 'api-reference' ? 'text-indigo-600 bg-indigo-50/70 font-extrabold' : 'text-slate-600'
              }`}
            >
              API Reference
            </a>
          </nav>

          <div className="flex items-center space-x-2">
            <a 
              href="https://github.com/voku/portable-ascii" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold transition-all shadow-xs"
              id="github-anchor"
            >
              <Code className="w-3.5 h-3.5 text-slate-300" />
              <span>GitHub</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </a>

            {/* Mobile Hamburger menu toggle button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              id="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="md:hidden bg-white border-t border-slate-200 overflow-hidden shadow-inner"
            >
              <div className="px-4 pt-2.5 pb-6 space-y-1 flex flex-col text-xs font-bold text-slate-600 tracking-wide uppercase">
                <a 
                  href="#about" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-3 rounded-xl transition-all flex items-center gap-2.5 ${
                    activeSection === 'about' ? 'bg-indigo-55/10 text-indigo-700 font-extrabold' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeSection === 'about' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  Why Portable?
                </a>
                <a 
                  href="#common-ops" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-3 rounded-xl transition-all flex items-center gap-2.5 ${
                    activeSection === 'common-ops' ? 'bg-indigo-55/10 text-indigo-700 font-extrabold' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeSection === 'common-ops' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  PHP Examples
                </a>
                <a 
                  href="#language-comparison" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-3 rounded-xl transition-all flex items-center gap-2.5 ${
                    activeSection === 'language-comparison' ? 'bg-indigo-55/10 text-indigo-700 font-extrabold' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeSection === 'language-comparison' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  Language Matrices
                </a>
                <a 
                  href="#performance" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-3 rounded-xl transition-all flex items-center gap-2.5 ${
                    activeSection === 'performance' ? 'bg-indigo-55/10 text-indigo-700 font-extrabold' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeSection === 'performance' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  Performance
                </a>
                <a 
                  href="#api-reference" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-3 rounded-xl transition-all flex items-center gap-2.5 ${
                    activeSection === 'api-reference' ? 'bg-indigo-55/10 text-indigo-700 font-extrabold' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeSection === 'api-reference' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  API Reference
                </a>
                <a 
                  href="https://github.com/voku/portable-ascii"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between mt-3 font-bold hover:bg-slate-800"
                >
                  <span className="flex items-center gap-2.5">
                    <Code className="w-4 h-4 text-slate-300" />
                    GitHub Repository
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO HERO SECTION */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 md:pt-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* LEFT COLUMN: INTRO */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-mono font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Requires PHP &gt;= 7.1</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-sans font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              ASCII-safe string handling for PHP, <span className="text-indigo-600">without extension drama.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Convert multilingual input, generate clean URL slugs, normalize filenames into a restricted ASCII-friendly shape, and clean problematic UTF-8 input with a small dependency-free PHP library.
            </p>

            {/* COMMAND CONTAINER */}
            <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-4 max-w-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span>COMPOSER INSTALL</span>
                <span className="text-emerald-600">MIT LICENSE</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                <code className="font-mono text-xs text-slate-800 font-bold select-all">
                  composer require voku/portable-ascii
                </code>
                <button 
                  onClick={() => triggerCopy('composer require voku/portable-ascii', 'composer')}
                  className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                  title="Copy installation command"
                  id="copy-composer-cmd"
                >
                  {copiedKey === 'composer' ? (
                     <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* STAMP GRID */}
            <div className="grid grid-cols-2 gap-4 max-w-sm pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>No runtime package dependencies</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>No required mbstring</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>No required iconv</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Optional intl support</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CORE SNIPPET BLOCK */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <span className="pl-2 font-mono text-xs text-slate-400 font-medium">example.php</span>
                </div>
                <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Core Example
                </span>
              </div>
              <div className="p-5 bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed select-all relative min-h-[220px]">
                <PhpCodeBlock code={`<?php

declare(strict_types=1);

use voku\\helper\\ASCII;

// German rules preserve common phonetic replacements.
echo ASCII::to_ascii('Düsseldorf', 'de');
// Duesseldorf

// English fallback keeps the output simpler.
echo ASCII::to_ascii('Düsseldorf', 'en');
// Dusseldorf

// Generate URL-safe slugs for routing.
echo ASCII::to_slugify('Fußgänger Altstadt', '-', 'de');
// fussgaenger-altstadt`} />
                
                <div className="absolute right-3 bottom-3">
                  <button
                    onClick={() => triggerCopy(`use voku\\helper\\ASCII;\necho ASCII::to_ascii('Düsseldorf', 'de');\necho ASCII::to_ascii('Düsseldorf', 'en');\necho ASCII::to_slugify('Fußgänger Altstadt', '-', 'de');`, 'core-example')}
                    className="p-1.5 rounded-md bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all text-[11px] font-mono flex items-center gap-1.5 shadow-sm"
                    title="Copy snippet"
                    id="copy-hero-snippet"
                  >
                    {copiedKey === 'core-example' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* THREE PILLAR ARCHITECTURAL HIGHLIGHTS */}
      <section className="bg-slate-50 border-y border-slate-200/70 py-16" id="about">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* PILLAR 1 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Extension Lock-In</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Some string conversion approaches depend on extensions like <code className="font-mono text-xs bg-slate-100 text-slate-850 px-1 rounded">mbstring</code>, <code className="font-mono text-xs bg-slate-100 text-slate-850 px-1 rounded">iconv</code>, or <code className="font-mono text-xs bg-slate-100 text-slate-850 px-1 rounded">intl</code>. Extension-dependent approaches can be unavailable on restricted hosts. Portable ASCII keeps the core runtime dependency-free and uses plain PHP by default.
              </p>
            </div>

            {/* PILLAR 2 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Language-Specific Replacements</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Generic accent stripping is not always enough. German <code className="font-mono text-xs text-indigo-600 bg-slate-50 px-1 rounded">ä</code>, <code className="font-mono text-xs text-indigo-600 bg-slate-50 px-1 rounded">ö</code>, <code className="font-mono text-xs text-indigo-600 bg-slate-50 px-1 rounded">ü</code>, and <code className="font-mono text-xs text-indigo-600 bg-slate-50 px-1 rounded">ß</code> need different output than a simple English fallback. Language-specific replacement rules are useful for familiar language-specific spellings.
              </p>
            </div>

            {/* PILLAR 3 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Security-Conscious Cleanup</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Portable ASCII includes helpers for malformed UTF-8 cleanup, invisible/control character removal, whitespace normalization, and MS Word typography normalization. Normalize input into a canonical form before applying domain-specific validation. These helpers can reduce ambiguity caused by malformed UTF-8, unusual whitespace, typography, and control characters, but they do not make untrusted input safe for a particular output context.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic leading-relaxed">
                * Note: These helpers are useful before validation, indexing, slug creation, and legacy export. They do not replace context-specific escaping, authorization, SQL parameter binding, or HTML sanitization.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* COMMON OPERATIONS: INTERACTIVE TAB PANEL */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" id="common-ops">
        
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-slate-900 tracking-tight">
            Common String Operations
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            A small, dependency-free library designed to run on plain PHP. Explore how each helper normalizes complex inputs predictably.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* TAB HEADERS */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5" role="tablist" aria-label="Common operations">
            {Object.entries(COMMON_OPERATIONS).map(([key, op]) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeTab === key}
                aria-controls={`op-panel-${key}`}
                id={`op-tab-${key}`}
                onClick={() => setActiveTab(key)}
                className={`text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500/55 ${
                  activeTab === key
                    ? 'bg-white border-indigo-500 shadow-sm text-slate-950 ring-1 ring-indigo-500/20'
                    : 'bg-transparent border-slate-200 hover:bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${
                  activeTab === key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold font-mono tracking-tight text-slate-900 truncate">{op.title}</h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{op.methodName}</p>
                </div>
              </button>
            ))}
          </div>

          {/* ACTIVE TAB DISPLAY CARD */}
          <div className="lg:col-span-8">
            <motion.div 
              key={activeTab}
              id={`op-panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`op-tab-${activeTab}`}
              initial={initialAnimation}
              animate={animateAnimation}
              transition={transitionAnimation}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden"
            >
              
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-2 items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                      {COMMON_OPERATIONS[activeTab].methodName}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal max-w-xl">
                    {COMMON_OPERATIONS[activeTab].description}
                  </p>
                </div>
                
                <button
                  onClick={() => triggerCopy(COMMON_OPERATIONS[activeTab].code, `op-${activeTab}`)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                  id={`copy-op-tab-${activeTab}`}
                >
                  {copiedKey === `op-${activeTab}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-6 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed select-all min-h-[280px]">
                <PhpCodeBlock code={COMMON_OPERATIONS[activeTab].code} />
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* DETAILED LANGUAGE MATRICES TABLE */}
      <section className="py-16 bg-slate-50 border-t border-slate-200" id="language-comparison">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-bold text-[10px] px-2.5 py-1 rounded-md">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>LANGUAGE- AND LOCALE-SPECIFIC REPLACEMENTS</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-slate-900 tracking-tight">
                Transliteration rules vary by language and locale.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Blindly stripping accents can reduce search quality and create inconsistent index keys. Portable ASCII uses deterministic language-specific replacement maps. The German vowels <code className="font-mono text-xs bg-slate-200/60 px-1 text-slate-900 rounded">ä, ö, and ü</code> map to <code className="font-mono text-xs text-indigo-600 font-semibold">ae, oe, and ue</code>, whereas the English fallback usually reduces them to a, o, and u.
              </p>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold text-xs flex items-center justify-center mt-0.5">de</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">German (Deutsch) Accent Rules</h4>
                    <p className="text-xs text-slate-500 font-mono">Düsseldorf Altstadt → Duesseldorf Altstadt</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold text-xs flex items-center justify-center mt-0.5">en</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">English (Global) Fallback</h4>
                    <p className="text-xs text-slate-500 font-mono">Düsseldorf Altstadt → Dusseldorf Altstadt</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold text-xs flex items-center justify-center mt-0.5">tr</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Turkish-Specific Replacements</h4>
                    <p className="text-xs text-slate-500 font-mono">Handles dotted and dotless i together with language-specific consonant mappings.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* TRANSLATION GRID TABLE */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Language-Aware Output Matrix
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                      <th className="p-3 font-bold">Input String</th>
                      <th className="p-3 font-bold">Operation / Language Context</th>
                      <th className="p-3 font-bold text-indigo-600">Portable ASCII Output</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50/40">
                      <td className="p-3 font-semibold text-slate-900">Düsseldorf</td>
                      <td className="p-3 text-slate-500">ASCII::to_ascii($str, 'de')</td>
                      <td className="p-3 text-emerald-600 font-bold">Duesseldorf</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40">
                      <td className="p-3 font-semibold text-slate-900">Düsseldorf</td>
                      <td className="p-3 text-slate-500">ASCII::to_ascii($str, 'en')</td>
                      <td className="p-3 text-emerald-600 font-bold">Dusseldorf</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40">
                      <td className="p-3 font-semibold text-slate-900">Fußgänger</td>
                      <td className="p-3 text-slate-500">ASCII::to_slugify($str, '-', 'de')</td>
                      <td className="p-3 text-emerald-600 font-bold">fussgaenger</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40">
                      <td className="p-3 font-semibold text-slate-900">déjà vu</td>
                      <td className="p-3 text-slate-500">ASCII::to_ascii($str, 'fr')</td>
                      <td className="p-3 text-emerald-600 font-bold">deja vu</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40">
                      <td className="p-3 font-semibold text-slate-900">中文😀</td>
                      <td className="p-3 text-slate-500">ASCII::to_transliterate($str)</td>
                      <td className="p-3 text-emerald-600 font-bold">Zhong Wen ?</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PERFORMANCE FOCUS BLOCK */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" id="performance">
        <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-10 shadow-lg relative overflow-hidden">
          
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                <Cpu className="w-3.5 h-3.5" />
                <span>PERFORMANCE REGRESSION SUITE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight">
                Includes optimized fast paths and an opt-in microbenchmark suite for detecting substantial performance regressions.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Portable ASCII includes optimized fast paths for standard plain ASCII strings. Internal caches reuse prepared lookup data across repeated calls.
              </p>
              
              <div className="pt-2">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono mb-1.5">
                  Run Opt-In Benchmarks
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The repository also includes an opt-in PHPUnit benchmark. Run it using:
                </p>
                <div className="mt-2 bg-slate-950 p-3 rounded-lg border border-slate-850 font-mono text-xs text-emerald-400 select-all block max-w-md">
                  PORTABLE_ASCII_RUN_PERFORMANCE_TESTS=1 ./vendor/bin/phpunit --filter PerformanceRegressionTest
                </div>
              </div>
            </div>

            {/* BAR PROGRESS CHARTS */}
            <div className="lg:col-span-6 bg-slate-950/60 backdrop-blur-sm p-6 rounded-xl border border-slate-800 space-y-4">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold block">
                Historical Benchmark Snapshot (Microseconds per Op)
              </span>
              <div className="text-[11px] text-slate-400 font-mono italic -mt-1 leading-tight">
                Commit: a283373, PHP 8.3.30, Linux x86-64, median across sampled benchmark rounds (Run Date: 2026-04-17). Note: The benchmark is explicitly opt-in and skipped unless the corresponding environment variable is set.
              </div>

              <div className="space-y-4 font-mono text-xs pt-2">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>ASCII <code className="text-indigo-400 font-bold font-mono">to_ascii()</code></span>
                    <span className="text-emerald-400">0.074 µs/op</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[8%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>German short <code className="text-indigo-400 font-bold font-mono">to_ascii()</code></span>
                    <span className="text-indigo-400">0.579 µs/op</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-400 h-full w-[45%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Latin short <code className="text-indigo-400 font-bold font-mono">to_ascii()</code></span>
                    <span className="text-indigo-400">0.692 µs/op</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-400 h-full w-[55%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Chinese long translit. via <code className="text-indigo-400 font-bold font-mono">to_ascii()</code></span>
                    <span className="text-slate-400">11.166 µs/op</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-600 h-full w-[90%]" />
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-normal">
                * Sourced from the checked-in historical performance report. Actual performance results depend on local hardware, operating system, container configuration, and PHP version.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* API REFERENCE DICTIONARY (ACCORDION STYLE FOR NON-DOMINANT VIEWS) */}
      <section className="py-16 bg-white border-t border-slate-200" id="api-reference">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-slate-900 tracking-tight">
              Class Method Reference
            </h2>
            <p className="text-sm text-slate-600 leading-normal">
              Accurate method signatures sourced directly from the core codebase. Click on any signature to expand full parameter details.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
            {API_REFERENCE.map((api) => {
              const isExpanded = expandedMethod === api.name;
              return (
                <div key={api.name} className="transition-all bg-white hover:bg-slate-50/30">
                  <button 
                    id={`api-btn-${api.name}`}
                    onClick={() => toggleExpandMethod(api.name)}
                    aria-expanded={isExpanded}
                    aria-controls={`api-details-${api.name}`}
                    className="w-full text-left p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 font-mono text-xs focus:outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500/55"
                  >
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="text-indigo-650 font-bold font-mono break-all text-[11.5px] leading-relaxed">
                        {api.signature}
                      </div>
                      <div className="text-slate-600 font-sans text-xs font-semibold">
                        {api.purpose}
                      </div>
                    </div>
                    <div className="text-slate-400 hover:text-slate-600 pt-1 sm:pt-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div 
                      id={`api-details-${api.name}`}
                      role="region"
                      aria-labelledby={`api-btn-${api.name}`}
                      className="px-5 pb-5 pt-1 bg-slate-50/50 border-t border-slate-100 space-y-3 text-xs"
                    >
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold tracking-wider block uppercase mb-1">Detailed Parameters:</span>
                        <div className="space-y-2 pl-2">
                          {api.parameters.map((p, pidx) => (
                            <div key={pidx} className="text-[11.5px] text-slate-600 leading-relaxed font-mono">
                              <code className="text-indigo-600 font-bold bg-indigo-50/60 border border-indigo-100 px-1.5 py-0.5 rounded text-[10.5px]">
                                {p.name}
                              </code> 
                              <span className="text-slate-400 font-normal pl-1.5">({p.type})</span> — <span className="font-sans text-slate-700">{p.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* MODERN PHP WRAPPER EXAMPLES */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            <div className="lg:col-span-5 space-y-4">
              <span className="font-mono text-xs text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded">
                OBJECT-ORIENTED VALUE OBJECT
              </span>
              <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-slate-900 tracking-tight">
                Modern PHP 8.2+ Value Object Wrapper
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Integrate Portable ASCII into domain-driven architectures using modern PHP features. Wrapping static calls creates a clean architectural boundary and provides well-defined typing constraints for your value objects.
              </p>
              
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-800 font-mono">Usage in modern structures</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  When slug generation is part of your domain model, encapsulate the conversion and its validation in a dedicated Value Object. Keep conversion rules and validation close to the domain value they produce.
                </p>
              </div>
            </div>

            {/* CLASS COMPACT SNIPPET CONTAINER */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  ArticleSlug.php — PHP 8.2+ Value Object Example
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              
              <div className="p-5 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed select-all">
                <pre>{`<?php

declare(strict_types=1);

use voku\\helper\\ASCII;

final readonly class ArticleSlug
{
    private function __construct(
        public string $value,
    ) {
    }

    public static function fromGermanTitle(string $title): self
    {
        $value = ASCII::to_slugify($title, '-', 'de');

        if ($value === '') {
            throw new InvalidArgumentException(
                'The title does not contain any slug-compatible characters.'
            );
        }

        return new self($value);
    }
}

$slug = ArticleSlug::fromGermanTitle(
    'Fußgängerübergänge in Düsseldorf'
);

echo $slug->value;
// fussgaengeruebergaenge-in-duesseldorf`}</pre>
              </div>

              <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center">
                <p className="text-[10px] text-slate-500 leading-normal">
                  Requires PHP 8.2 or newer because it uses a native readonly class declaration.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800" id="footer">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <span className="font-mono text-sm font-bold text-white tracking-tight">
              voku/portable-ascii
            </span>
          </div>

          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Small, MIT-licensed, production-oriented string helper library. Highly predictable character replacements built specifically for boring production realities.
          </p>

          <div className="flex items-center justify-center space-x-6 text-xs font-semibold text-slate-300">
            <a href="https://github.com/voku/portable-ascii" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
            <a href="https://github.com/voku/portable-ascii/issues" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Issues</a>
            <a href="https://github.com/voku/portable-ascii/blob/master/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">MIT License</a>
            <a href="https://packagist.org/packages/voku/portable-ascii" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Packagist</a>
          </div>

          <div className="text-[10px] text-slate-600 font-mono pt-4">
            © 2026 Portable ASCII. Clean code, reliable strings.
          </div>
        </div>
      </footer>

    </div>
  );
}
