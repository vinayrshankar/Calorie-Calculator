# Calorie & Energy Needs Calculator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A lightweight, embeddable calorie and energy-needs calculator designed for shared cPanel hosting using **PHP, CSS, and vanilla JavaScript**.

The calculator estimates resting energy expenditure, total daily energy expenditure (TDEE), and suggested calorie targets for **weight maintenance, weight loss, or weight gain**. It can also use a user-entered BMR/RMR value from a metabolic or body-composition report.

Developed by **Vinay Shankar** for [The Fitclub Academy / TFA](https://tfaworld.org/).

## Features

- Age input
- Height in:
  - centimeters
  - feet and inches
- Weight in:
  - kilograms
  - pounds
- Sex input for equations that require it
- Optional user-entered BMR/RMR
- Predictive resting-energy equations:
  - Mifflin–St Jeor
  - Katch–McArdle
  - Cunningham
- Optional body-fat percentage for lean-mass-based equations
- Standard activity-factor selections plus a custom activity factor
- Estimated TDEE
- Goal options:
  - maintain weight
  - lose weight
  - gain weight
- Percentage-based calorie deficits and surpluses
- Goal-specific nutrition and activity guidance
- Responsive layout
- Cross-domain iframe embedding
- Automatic iframe height resizing using `postMessage()`
- Content Security Policy and browser security headers
- No database
- No account system
- No external JavaScript libraries
- No server-side storage of calculator inputs

## Project Structure

```text
Calorie-Calculator/
├── calorie-calculator.php
├── calorie-calculator.css
├── calorie-calculator.js
├── embed-on-tfaworld.html
├── LICENSE
└── README.md
```

## Requirements

The calculator is intentionally simple and should work on most standard shared hosting environments.

### Server

- Apache or compatible web server
- PHP 8.x recommended
- HTTPS strongly recommended
- No database required
- No Node.js required
- No build process required
- No package manager required

### Browser

A modern browser with JavaScript enabled is required.

## Installation on cPanel

1. Open **cPanel → File Manager**.
2. Open the document root for the application domain.
3. Upload these three files to the same directory:

```text
calorie-calculator.php
calorie-calculator.css
calorie-calculator.js
```

For the TFA deployment, the calculator can be hosted at:

```text
https://apps.tfaworld.org/calorie-calculator.php
```

The PHP, CSS, and JavaScript files must remain in the same directory unless their asset paths are changed in the PHP file.

## Embedding on tfaworld.org

The included `embed-on-tfaworld.html` file contains the complete iframe and resize listener.

Paste its contents into a WordPress **Custom HTML** block or an Elementor **HTML** widget.

Example:

```html
<div id="tfa-calorie-calculator-wrap" style="width:100%;max-width:100%;overflow:hidden;">
  <iframe
      id="tfa-calorie-calculator"
      src="https://apps.tfaworld.org/calorie-calculator.php"
      title="TFA Calorie & Energy Needs Calculator"
      width="100%"
      height="1200"
      loading="lazy"
      sandbox="allow-scripts allow-same-origin"
      style="width:100%;border:0;display:block;overflow:hidden;">
  </iframe>
</div>
```

The JavaScript included in `embed-on-tfaworld.html` listens for verified height messages from `https://apps.tfaworld.org` and automatically changes the iframe height as calculator fields and results expand.

Do not paste only the iframe if you want automatic height resizing.

## Domain Restriction

The calculator is currently configured so it can be framed only by TFA domains.

Inside `calorie-calculator.php`:

```php
"frame-ancestors 'self' https://tfaworld.org https://www.tfaworld.org;"
```

This prevents arbitrary third-party websites from embedding the hosted calculator.

If you deploy the project on another website, change the allowed parent origins in both:

- `calorie-calculator.php`
- `calorie-calculator.js`

and update the expected calculator origin in the parent embed code.

## Security Design

The calculator is deliberately designed with a small attack surface.

### Content Security Policy

The PHP file sends a restrictive Content Security Policy that:

- loads scripts only from the calculator's own origin
- loads styles only from the calculator's own origin
- blocks plugins/objects
- blocks forms from submitting
- blocks external network connections from JavaScript
- limits iframe embedding to approved domains

### Other Security Headers

The application also sends:

```text
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

### No Database or Server-Side Personal Data Storage

Age, height, weight, body-fat percentage, activity factor, and goal selections are processed in the visitor's browser by JavaScript.

The calculator does not require a database and does not store entered measurements on the server.

### Secure iframe Communication

The embedded calculator uses `window.postMessage()` only for iframe sizing. Parent-origin and source checks are used before the host page accepts a resize request.

## Calculation Logic

### Mifflin–St Jeor

For males:

```text
RMR = (10 × weight in kg) + (6.25 × height in cm) − (5 × age) + 5
```

For females:

```text
RMR = (10 × weight in kg) + (6.25 × height in cm) − (5 × age) − 161
```

### Katch–McArdle

First estimate fat-free mass:

```text
FFM = body weight in kg × (1 − body-fat fraction)
```

Then:

```text
RMR = 370 + (21.6 × FFM in kg)
```

### Cunningham

```text
RMR = 500 + (22 × FFM in kg)
```

### Total Daily Energy Expenditure

```text
TDEE = RMR × activity factor
```

Available default activity factors are:

| Activity Level | Factor |
|---|---:|
| Sedentary | 1.20 |
| Lightly active | 1.375 |
| Moderately active | 1.55 |
| Very active | 1.725 |
| Extremely active | 1.90 |
| Custom | User-defined |

Activity multipliers are estimates rather than direct measurements of energy expenditure.

## Goal Adjustments

### Weight Loss

The calculator currently offers:

- 10% below estimated maintenance
- 15% below estimated maintenance
- 20% below estimated maintenance

### Weight Gain

The calculator currently offers:

- 5% above estimated maintenance
- 10% above estimated maintenance
- 15% above estimated maintenance

### Maintenance

Maintenance uses the estimated TDEE without a calorie adjustment.

## Entering a BodyComp / Metabolic-Test Value

Users who already have a BMR or RMR result may select:

```text
Enter value from body-composition / metabolic report
```

That value is used as the resting-energy input instead of a predictive equation.

A body-composition device may itself provide a predicted BMR rather than a directly measured resting metabolic rate. Indirect calorimetry is a different measurement method. The calculator therefore describes the entered value as a reported BMR/RMR rather than automatically calling it a direct measurement.

## Result Guidance

In addition to calorie estimates, the calculator provides practical guidance based on the selected goal and preferred activity approach.

The current activity preferences are:

- mixed resistance and aerobic activity
- resistance-focused training
- cardio-focused training
- walking/general movement

The calculator also reminds users not to automatically add exercise calories back to their food target when the selected activity factor already represents their normal training.

## Responsive iframe resizing

The calculator sends its current document height to the approved parent website.

The host page validates:

- `event.origin`
- `event.source`
- message type
- numeric height bounds

before changing the iframe height.

This prevents the results panel from being clipped when it expands and avoids relying on a large fixed iframe height.

## Customization

Most visual settings are available as CSS variables near the top of `calorie-calculator.css`:

```css
:root{
  --bg:#f6f8fb;
  --card:#ffffff;
  --text:#172033;
  --muted:#667085;
  --accent:#1f6feb;
}
```

These can be changed to match another website's branding.

## Medical / Educational Disclaimer

This calculator is intended for **educational and informational purposes only**. Predictive energy equations and activity multipliers are estimates and can differ substantially from an individual's actual energy requirements.

The calculator is not a diagnosis, medical treatment, or individualized diet prescription. People who are pregnant, under 18, have a history of eating disorders, have significant medical conditions, or are following clinician-directed nutrition therapy should obtain individualized guidance from an appropriately qualified healthcare or nutrition professional.

## Privacy

The current version does not transmit calculator measurements to a database or save them to an account. Calculations are performed locally in the browser.

If analytics, saved results, accounts, APIs, or server-side logging are added later, the privacy documentation should be updated accordingly.

## Author

**Vinay Shankar**  
The Fitclub Academy / TFA  
https://tfaworld.org/

## Contributions

Issues and pull requests are welcome. Please include enough detail to reproduce bugs and explain proposed changes to equations, defaults, security behavior, or user-interface logic.

## License

This project is licensed under the **MIT License**. See [`LICENSE`](LICENSE) for the full license text.

Copyright © 2026 Vinay Shankar.