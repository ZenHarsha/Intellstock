
# Fix: HTML Structure and Build Error

## Problem
The `index.html` has a `<script>` tag placed between `<html>` and `<head>`, which is invalid HTML and causes Vite's parser to fail with "misplaced-start-tag-for-head-element".

## Solution
Move the theme-detection script inside the `<head>` tag, right after the opening `<head>` and charset meta tag. This fixes the build error while preserving the flash-free theme switching behavior.

## Technical Details

**File: `index.html`**
- Remove the `<script>` block from between `<html>` and `<head>` (lines 3-9)
- Place it inside `<head>`, after the charset and viewport meta tags
- The script still runs early enough to prevent theme flash since it's a blocking inline script in `<head>`
