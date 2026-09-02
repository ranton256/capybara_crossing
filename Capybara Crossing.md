# Capybara Crossing Game

## How to read this document

This document is structured as a set of art requirements followed by functional requirements for features specified as BDD (behavior driven development) scenarios specified in Gherkin format. The last section, “Optional features” contains optional features for the developer to consider, but **should not be implemented** until if and when they are specifically requested.

## Game Overview 

Capybara Crossing is a retro arcade tutorial game designed as a zero-dependency, browser-based JavaScript application. Players guide a pixel-art capybara across a busy jungle pathway filled with moving obstacles to reach a warm mud spa. The game focuses on classic obstacle-dodging mechanics, utilizing precise grid-based movement, 16x16 pixel-art assets, and a frame-rate independent game loop to deliver a laid-back arcade experience that runs directly in any modern web browser.

## Fixed Parameters

These values are given, not design decisions. Use them exactly.

| Parameter | Value |
| :---- | :---- |
| Board | 12 columns × 7 rows of 16×16 tiles |
| Canvas | 576 × 336 (integer scale ×3) |
| Rows (top→bottom) | 0 spa · 1 road · 2 median · 3 road · 4–6 riverbank |
| Spawn | column 6, row 6, facing up |
| Starting lives | 3 |
| Row 1 traffic | trucks, 2 tiles wide, moving right at 1.5 tiles/sec |
| Row 3 traffic | ATVs, 1 tile wide, moving left at 2.5 tiles/sec |
| Timing beats | death 550ms · spa sink 400ms · hit flash 100ms |

## Pixel-Art Asset Layout (16x16 Grid)

For a simple retro arcade tutorial, using a **16x16 pixel grid** per tile/sprite keeps things readable, easy to draw, and performant. Below is the layout plan for your capybara game assets, organized by category.

### 1\. Character Sprites (The Capybara)

*Dimensions: 16x16 pixels per frame*

* **Idle / Facing Up (2 frames):**  
  * Flat, blocky oval shape with a blunt snout and tiny rounded ears.  
  * *Frame 1 (Standing):* Neutral posture, eyes closed in total serenity.  
  * *Frame 2 (Waddling):* Slight vertical squash-and-stretch with shifted leg pixels to imply movement.  
* **Movement / Directional (Left/Right/Down):**  
  * Profile view showing the stout body, small snout, and short legs moving in a simple 2-frame walking cycle.  
* **Defeat / "Unfazed" Animation:**  
  * The capybara blinks or tilts its head slightly with a tiny "Zzz" pixel floating above it instead of a traditional violent explosion.

### 2\. Environment & Background Tiles

*Dimensions: 16x16 pixels per tile (Tiled grid)*

* **Starting Zone (The Riverbank / Jungle Edge):**  
  * Earthy brown dirt pixels mixed with tufts of bright green grass at the top edge.  
* **The Pathway (Road Lanes):**  
  * Dark grey pavement or packed dirt texture with faded yellow or green dashed center lines.  
* **The Safe Zones (Medians):**  
  * Patchy grass tiles with tiny pixel flowers or a small rock detail to give the player a resting spot between lanes.  
* **The Goal Zone (The Mud Spa):**  
  * Rich, bubbling dark brown mud tiles surrounded by warm green reeds and smooth grey river stones.

### 3\. Hazard Sprites

*Dimensions: 16x16 or 32x16 pixels*

* **Moving Obstacles (Jungle Vehicles / Carts):**  
  * *Small ATV / Buggy (16x16):* Bright red or blue pixel chassis with black wheels and a windshield glint.  
  * *Jungle Truck (32x16 \- Double width):* A longer green utility vehicle moving across two grid spaces.  
* **Alternative Hazards (Optional River Section):**  
  * *Floating Logs (32x16):* Textured brown wood logs with bark rings on the ends, drifting horizontally.  
  * *Surprise Critter (16x16):* A fast-moving, wide-eyed jungle monkey or parrot darting across a lane.

### Asset Sheet Organization Tip

Pack these into a single sprite sheet (e.g., 128 x 128 pixels) to optimize rendering in a browser canvas or game engine.

Two constraints of the supplied art:

* `tile_start` carries its grass band in the top row only, and `tile_path` has road shoulders baked into its top and bottom rows. Use exactly one road row per lane; stacked riverbank rows will repeat the grass band.
* All vehicle sprites face left. Flip horizontally when drawing right-moving lanes.

# Feature: Gameplay Scenarios

As a retro arcade gamer, I want to guide a delightfully chill pixel-art capybara safely across a busy jungle pathway to a warm mud spa, so that I can experience classic obstacle-dodging action with maximum laid-back vibes.

### Scenario: Advancing toward the spa

* **Given** the capybara is at the starting position at the bottom of the screen  
* **When** the player presses the **Up** directional key  
* **Then** the capybara sprite waddles forward by one grid unit  
* **And** the game score increases by **10 points**, but only if that row is farther north than any row reached during the current life. The watermark resets to the spawn row on death and after each spa clear.

### Scenario: Dodging jungle hazards

* **Given** a speeding motorized all-terrain vehicle is crossing the jungle path lane  
* **When** the capybara sprite's collision box overlaps with the vehicle's collision box  
* **Then** the capybara holds its defeat pose, with movement input ignored for the duration of the death beat  
* **And** the player loses **1 life**  
* **And** the capybara respawns calmly at the starting position

### Scenario: Reaching the ultimate goal (The Hot Mud Spa)

* **Given** the capybara is positioned directly below the steaming mud spa at the top of the screen (the entire top row is the goal; there are no separate bays and no occupancy state)  
* **When** the player presses the **Up** directional key into the goal zone  
* **Then** the capybara happily sinks into the mud  
* **And** the player is awarded **50 bonus points**  
* **And** a fresh capybara appears at the start for the next round

## Feature: Game Engine Architecture and Loop Execution

As a game developer building a zero-dependency JavaScript browser game,  
I want a frame-rate independent game loop and modular file structure,  
So that the game runs smoothly using native browser APIs without external build tools.

### Scenario: Initializing the zero-dependency browser environment

* **Given** the project contains an entry-point **index.html**, a styling sheet **style.css**, and a logic script **game.js**  
* **When** the user opens **index.html** in a modern web browser without a local server or package manager  
* **Then** the canvas viewport renders correctly with crisp pixel-art scaling via disabled anti-aliasing styles  
* **And** the game executes directly in the runtime environment without throwing dependency or bundling errors
* **And** the atlas PNG is loaded through an `<img>` element, with sprite source rectangles written as constants in **game.js**
* **And** the game performs no runtime `fetch` or `XMLHttpRequest` for **manifest.json**, and uses no `<script type="module">` — browsers block both over `file://`. `manifest.json` is a build-time reference for humans only.

### Scenario: Keeping game logic unit-testable

* **Given** the game logic and the canvas/DOM glue both live in **game.js**  
* **When** a test runner imports the file outside a browser  
* **Then** state transitions (hop, hazard motion, collision, scoring, lifecycle) are plain functions callable without a canvas or DOM  
* **And** the file exposes them through a guarded `module.exports` block that the browser ignores, so the zero-dependency boot is unaffected

### Scenario: Synchronizing the game update and render cycle

* **Given** the game engine is active and running its core execution loop  
* **When** the browser triggers the native **requestAnimationFrame** callback  
* **Then** the update phase processes player inputs, moves hazards, and evaluates collision or goal conditions first  
* **And** the render phase subsequently clears the canvas and draws the background, entities, and UI in back-to-front order
* **And** hazard speeds are expressed in tiles per second and scale by elapsed time, so motion is identical at 60Hz and 120Hz

## Feature: Discrete Grid Input Management

As a retro arcade player,

I want my directional keystrokes to translate into precise movements,

So that I can cleanly navigate the game board without floating-point drifting.

### Scenario: Executing a valid grid movement

* **Given** the player capybara is positioned within the interior bounds of the game grid  
* **When** the player presses a directional arrow key (**ArrowUp**, **ArrowDown**, **ArrowLeft**, or **ArrowRight**)  
* **Then** the input event listener triggers a discrete translation equal to a single grid tile size  
* **And** the player entity position updates instantly to the adjacent grid coordinate

### Scenario: Enforcing canvas boundary constraints

* **Given** the player capybara is positioned at the outer boundary edge of the game board  
* **When** the player presses an arrow key directed outward past the boundary  
* **Then** the movement logic validates the coordinate against grid limits  
* **And** the player position remains locked to the outer edge without moving off-screen

## Feature: Canvas Rendering Pipeline

As a player viewing the arcade screen,  
I want each frame drawn cleanly in a fixed layer order,  
So that the board reads clearly without ghosting.

### Scenario: Clearing previous frame artifacts

* **Given** the game is progressing through successive animation frames  
* **When** a new render cycle begins  
* **Then** the canvas context completely clears its entire drawing area to prevent ghosting or visual smearing

### Scenario: Enforcing painter's algorithm draw order

* **Given** the canvas context is ready to draw the current frame state  
* **When** the render pipeline executes drawing commands  
* **Then** background and static environment tiles are drawn first  
* **And** dynamic obstacle entities and the player character sprite are drawn over the background  
* **And** the heads-up display text is rendered on top of all game elements

## Feature: Game State and Level Lifecycle Management

As a game designer controlling session flow,  
I want automated state tracking for scores, lives, and resets,  
So that players experience a seamless loop of victories and defeats without page reloads.

### Scenario: Resetting level state after a goal or death event

* **Given** the player has either successfully reached the mud spa goal or lost a life to a hazard  
* **When** the level reset mechanism is triggered by the engine state machine  
* **Then** the player entity coordinates reset automatically to the initial starting position  
* **And** active scores and remaining life counters persist accurately into the next active round cycle

## Feature: Capybara Collision Detection and Hazard Mechanics

As a retro arcade developer,  
I want robust BDD specifications for collision detection between the player and moving hazards,  
So that I can implement accurate hit-boxes and penalty logic in vanilla JavaScript.

### Scenario: Overlapping bounding boxes triggers a hazard collision

* **Given** the player capybara occupies grid position **(x, y)** with bounding dimensions matching a single tile size  
* **And** a moving hazard entity (e.g., jungle ATV) occupies overlapping spatial coordinates **(hazard.x, hazard.y)**  
* **When** the collision detection system evaluates axis-aligned bounding box (AABB) intersection between the player and the hazard  
* **Then** a collision event is successfully registered  
* **And** the player loses **1 life** from the global state counter  
* **And** the capybara position instantly resets to the initial starting coordinates

### Scenario: Continuous traffic flow

* **Given** a hazard traveling horizontally in its lane  
* **When** its trailing edge passes the canvas boundary  
* **Then** it reappears at the opposite edge and continues at the same speed

### Scenario: Safe passing between hazard bounds

* **Given** the player capybara occupies a safe resting median tile between road lanes  
* **And** a moving hazard entity passes across an adjacent row without intersecting the player's bounding box  
* **When** the collision detection system evaluates axis-aligned bounding box (AABB) intersection  
* **Then** no collision event is registered  
* **And** the player life total and position remain completely unchanged

### Scenario: Zero-life game over trigger

* **Given** the player capybara has exactly **1 life** remaining  
* **When** a collision event with a moving hazard is registered by the system  
* **Then** the remaining life count decreases to **0**  
* **And** the game state transitions from active gameplay to a "Game Over" screen  
* **And** the final score is displayed, and pressing **Enter** or **Space** starts a new run

# Optional features

These are additional, optional features to consider for specification and implementation.

### **1\. Timing and Pressure Mechanics (The Countdown Timer)**

Classic arcade games like Frogger use time limits to prevent players from camping safely on medians indefinitely.

* **Feature:** **Round Countdown Timer**  
  * **Requirement:** Implement a visual timer bar or countdown clock starting at a fixed duration (e.g., 30 seconds) per round.  
  * **Requirement:** If the timer reaches zero before reaching the goal, the player automatically loses **1 life** and the round resets, mirroring a hazard collision.  
  * **Requirement:** Award bonus score points for every second remaining when the goal is successfully reached.

### **2\. Progressive Difficulty Scaling**

To make the game replayable, subsequent rounds need to ramp up the challenge.

* **Feature:** **Difficulty Progression**  
  * **Requirement:** When a player successfully reaches the goal, increment a difficulty multiplier or level counter.  
  * **Requirement:** Increase the movement speed of all active hazard entities by a set percentage (e.g., \+10% speed per level) with each successful round.

### **3\. Audio Feedback (Web Audio API)**

Sound effects elevate retro games immensely, and students can implement basic retro beeps using the native browser API without importing audio files.

* **Feature:** **Procedural Retro Sound Effects**  
  * **Requirement:** Utilize the browser's built-in **Web Audio API** (`AudioContext`) to generate synthesized sound effects.  
  * **Requirement:** Trigger distinct procedural tones or frequency sweeps for specific game events: a short rising beep for a successful forward hop, a low buzz for losing a life, and a joyful chime sequence for reaching the mud spa.

### **4\. Persistent High Scores (Local Storage)**

Adding score tracking encourages students to learn how to save data across browser sessions.

* **Feature:** **Local Storage High Score Tracking**  
  * **Requirement:** Track the session high score alongside the current score in the UI HUD.  
  * **Requirement:** Use the browser's `localStorage` API to save the highest score achieved so that it persists even if the student refreshes or closes the browser tab.

