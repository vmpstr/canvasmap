## todos

for parity:
- hide children
- links / decorations
- styles

for replacement:
- github auto populate

other:
- error system (e.g. when memento fails to load or parse)

## refactors

- refactor js into separate files
- only add event handlers for states where it makes sense (like idle?)
- maybe use attribute for maxWidth and use that in style?

## bugs

- scroller child does not have max height?
- when resizing a scroller, scroll offset gets reset because we determine
  unrestricted size
- when clicking ew resizer, the scroller parent gets selected
- when resizing cursor should always be present
- after editing label, maxWidth may need to be reset (from EW resizing)
- scroller needs to scroll if dragging needs it to

## thoughts

- flavors: same layout types present as bullet point, numbered list, checkboxes, etc
- scribe: js class that remembers states, allows for setting state and retrieving previous/next states (undo/redo). can piggy back off memento that remembers stuff
- memento: saving system.