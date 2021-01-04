## Disclaimer

- The principles and specifics don't necessarily reflect the code (yet)

## Principles

- Separate ephemeral session state from persistent state as much as possible (and name accordingly)
- This of the model as db tables (dict <=> table)
- Don't try to stuff too much info into each top level structure

## Specifics

- nodes : Dict NodeId Node -- payload
- children: Dict NodeId (List NodeId) -- ordered child relationships 
- positions: Dict NodeId Vector -- top level child positions