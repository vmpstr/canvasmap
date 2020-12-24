## todos

- resizing tree node
- resizing scroller node
- hide children
- links / decorations
- github auto populate
- styles

## refactors

- move node encoders decoders and definitions to a isolated place

## bugs

- enter (sibling add) on a top level should add child
- when clicking ew resizer, the scroller parent gets selected
- when resizing cursor should always be present
- resizing does not trigger a state change, so it doesn't save
- after editing label, maxWidth may need to be reset (from EW resizing)

## thoughts

- flavors: same layout types present as bullet point, numbered list, checkboxes, etc
- scribe: js class that remembers states, allows for setting state and retrieving previous/next states (undo/redo)