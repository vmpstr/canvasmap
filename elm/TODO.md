## todos

- hide children
- links / decorations
- github auto populate
- styles
- error system (e.g. when memento fails to load or parse)

## refactors

- move node encoders decoders and definitions to a isolated place
- only add event handlers for states where it makes sense (like idle?)
- refactor js into separate files
- maybe use attribute for maxWidth and use that in style?
- refactor resizers

## bugs

- enter (sibling add) on a top level should add child
- when clicking ew resizer, the scroller parent gets selected
- when resizing cursor should always be present
- resizing does not trigger a state change, so it doesn't save
- after editing label, maxWidth may need to be reset (from EW resizing)
- scroller needs to scroll if dragging needs it to
- tab new item needs to focus

## thoughts

- flavors: same layout types present as bullet point, numbered list, checkboxes, etc
- scribe: js class that remembers states, allows for setting state and retrieving previous/next states (undo/redo). can piggy back off memento that remembers stuff
- memento: saving system.