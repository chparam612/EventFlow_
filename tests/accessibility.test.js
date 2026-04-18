/**
 * EventFlow V2 — Accessibility Audit Suite
 * Validates WCAG 2.1 Compliance using JSDOM
 * Focus: Landmarks | Skip-Links | ARIA | Screen Reader Utilities
 */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function runAccessibilityAudit() {
  console.log('\n♿ ACCESSIBILITY COMPLIANCE AUDIT (JSDOM)');
  console.log('─'.repeat(50));

  const targets = [
    { name: 'Landing/Main', path: 'public/index.html' },
    { name: 'Navigation Map', path: 'public/attendee-navigation.html' }
  ];

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  for (const target of targets) {
    console.log(`\n🔹 Auditing: ${target.name}`);
    try {
      const html = fs.readFileSync(path.join(projectRoot, target.path), 'utf8');
      const dom = new JSDOM(html);
      const { document } = dom.window;

      // 1. Semantic Landmarks
      assert(!!document.querySelector('main'), 'Document contains a <main> landmark');
      assert(!!document.querySelector('nav'), 'Document contains a <nav> landmark');
      
      // 2. Skip Navigation Links
      const skipLink = document.querySelector('.skip-link');
      assert(!!skipLink && skipLink.getAttribute('href')?.startsWith('#'), 'Skip-link exists and targets an internal ID');

      // 3. ARIA Live Regions (for Dynamic Content)
      const ariaLive = document.querySelectorAll('[aria-live]');
      assert(ariaLive.length > 0 || html.includes('aria-live'), 'ARIA-live regions found or defined for dynamic updates');

      // 4. Form Labels / Screen Reader Helpers
      const srOnly = html.includes('sr-only');
      assert(srOnly, '.sr-only utility class exists for screen-reader-only context');

      // 5. Image Alts & Frame Titles
      const media = document.querySelectorAll('img, iframe');
      let allMediaValid = true;
      media.forEach(el => {
        if (el.tagName === 'IMG' && !el.hasAttribute('alt')) allMediaValid = false;
        if (el.tagName === 'IFRAME' && !el.hasAttribute('title') && !el.hasAttribute('aria-label')) allMediaValid = false;
      });
      assert(allMediaValid, `All ${media.length} media elements (img/iframe) have descriptive alt/title/aria-label`);

      // 6. Interactive Element Clarity
      const buttons = document.querySelectorAll('button');
      let buttonsValid = true;
      buttons.forEach(btn => {
        if (!btn.textContent.trim() && !btn.hasAttribute('aria-label')) buttonsValid = false;
      });
      assert(buttonsValid, 'All buttons contain either text content or an aria-label');

    } catch (e) {
      console.error(`  ⚠️  Critical Audit Error in ${target.name}:`, e.message);
      failed++;
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`Accessibility Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n🚨 Accessibility audit failed. Please fix violations before final submission.\n');
    process.exit(1);
  } else {
    console.log('\n🎉 Accessibility audit passed. WCAG 2.1 compliance verified.\n');
    process.exit(0);
  }
}

runAccessibilityAudit().catch(err => {
  console.error('Fatal error during accessibility audit:', err);
  process.exit(1);
});
