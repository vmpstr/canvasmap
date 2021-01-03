## todos

for parity:
- hide children
- links / decorations
- styles
- undo / redo

for replacement:
- github auto populate
- zoom scroll wheel / pinch?

other:
- error system (e.g. when memento fails to load or parse)

## refactors

- only add event handlers for states where it makes sense (like idle?)

## bugs

- scroller needs to scroll if dragging needs it to

minor:
- when clicking ew resizer, the scroller parent gets selected
- when resizing cursor should always be present
- after editing label, maxWidth may need to be reset (from EW resizing)

## thoughts

- flavors: same layout types present as bullet point, numbered list, checkboxes, etc
- scribe: js class that remembers states, allows for setting state and retrieving previous/next states (undo/redo). can piggy back off memento that remembers stuff
- memento: saving system.