
## Intro
Written in typescript, with 2 configurations:
* dev: linting rules are relaxed
* prod: strict linting rules


## Dev mode
1. During dev, launch: `yarn run dev` to auto-compile typescript.
2. Launch the server with `yarn run start:dev` to have auto-restart and better logs display


## Changing code
- try to express intent as much as possible
- minimize globals
- minimize dependencies, share code only when really necessary
- do not share code through inheritance, use mixins as much as possible
- avoid state as much as possible, embrace functional programming
- use simple dependency injection through factories for testability
  - inject only what is needed as parameter or test, no over-engineer


## Committing
Before committing: `yarn run build`
