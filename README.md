# Purpose of Waveform UI

- Visualise event waveforms
- Perform interactive processing
    - Pick/repick P and S wave
    - Change evaluation status (event.preferred_origin().evaluation_status)
    - Change event type (event.event_type)
- Show relevant event information
    - Event origin time (event.preferred_origin().time)
    - Event location (event.preferred_origin().loc)
    - Event location uncertainty (event.preferred_origin().origin_uncertainty.confidence_ellipsoid.semi_major_axis_length)
    - Event magnitude (event.preferred_magnitude().mag)
    - Event magnitude uncertainty (event.preferred_magnitude().mag_error)
    - Event magnitude type (event.preferred_magnitude().magnitude_type)
    - Event type (event.event_type)
    - Event evaluation status (event.preferred_origin().evaluation_status)
    - Event ID (event.resource_id)
- Show event location on an insert map

# User Interface Design

# Interaction
Key Overview:
**Picking**  
**d** - Activate the P picking mode  
**f** - Activate the S picking mode  
**s** - Undo last picking operation

**Event Types and Status**  
**e** - Seismic event (Map to "induced or triggered event")  
**b** - Blast (Map to "Mining Explosion")  
**w** - roll through a list of event type   
**@ + TYPE (Autocompletion while typing)** - gives access to all the other QuakeML types  
**r** - toggle between **accepted** and **rejected**

**Zoom and Pan**  
**z** - toggle common time mode (solidary time axis, default common time on)  
**x** - toggle common amplitude mode (solidary y axis, default common amplitude off) 

**Navigation**
**1** - Previous page  
**2** - Next page

**Other**  
**t** - toggle beween waveform and travel time model (distance - travel time)  
**g** - reprocess event (calculate location, magnitude and focal mechanism)

## Picking

keys

**d** - Activate the P picking mode  
**f** - Activate the S picking mode  
**s** - Undo last picking operation


When either mode is activated

**left click** - add or modify P or S pick    
**double left click** - remove P or S pick  
**right click** - remove both P and S

## Change event type 

(see possible value at https://docs.obspy.org/packages/obspy.core.event.header.html#obspy.core.event.header.EventType)

**e** - Seismic event (Map to "induced or triggered event")  
**b** - Blast (Map to "Mining Explosion")  
**w** - roll through the list below:   
    - Open pit blast (Map to "Quarry Explosion")  
    - Regional Event / Earthquake (Map to "Earthquake")  
    - Drilling Noise (Map to "Other Event", add "Drilling Noise" in Event.event_description)  
    - Crusher Noise (Map to "Other Event", add "Crusher Noise" in Event.event_description)  
    - Surface Noise (Map to "Other Event", add "Surface Noise" in Event.event_description)  
        
**@ + TYPE (Autocompletion while typing)** - gives access to all the other QuakeML types    
(see  https://docs.obspy.org/packages/obspy.core.event.header.html#obspy.core.event.header.EventType)  

## Change evaluation status

(evaluation status -> event.preferred_origin().evaluation_status)

**r** - toggle between **accepted** and **rejected**  
- Accepted  
    - event.preferred_origin().evaluation_status = 'final'  
    - event.preferred_origin().evaluation_mode = 'manual'  
- Rejected  
    - event.preferred_origin().evaluation_status = 'final'  
    - event.preferred_origin().evaluation_mode = 'rejected'

## Zoom and Panning

**ALT + WHEEL** - X axis (time) Pan  
**CTRL + WHEEL** - Y axis zoom  
**SHIFT + WHEEL** - X axis zoom  

**z** - toggle common time mode (solidary time axis, default common time on)  
**x** - toggle common amplitude mode (solidary y axis, default common amplitude off)  

## Navigation between pages

**1** - Previous page  
**2** - Next page

## other

**t** - toggle beween waveform and travel time model (distance - travel time)  
**g** - reprocess event (calculate location, magnitude and focal mechanism)
    1- A message is sent through a particular Kafka topic which trigger the processing of the event
    2- Database is modified
    3- UI receives notification (Kafka, websocket) that the database has been modified
    4- Event information is updated

## CURRENT KEYS

Zoom using mouse and keys:
    
    Selected channel or Zoom All
        Mouse Wheel                 - Y zoom
        Alt + Mouse Wheel             - X zoom
        Arrow Keys Up/Down            - Y zoom
        Arrow Keys Left/Right        - Y pan
        Alt + Arrow Keys Up/Down    - X zoom
        Alt + Arrow Keys Left/Right    - X pan
        Back zoom - button
        Reset View - button

Picks:

    Ctrl + Left Mouse Button to Select Pick     - Remove P/S Pick
    Ctrl + Middle Mouse Button                     - Add new P Pick
    Shift + Middle Mouse Button                 - Add new S Pick
    Context Menu                                 - Delete multiple P/S Picks

# WaveformUiAngular

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.1.0.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
