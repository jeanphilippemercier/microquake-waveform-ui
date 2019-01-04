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

## IMS User Interface Example

ADDING IMAGE OF USER INTERFACE

## Proposed User Interface Layout

ADDING IMAGE OF PROPOSED USER INTERFACE SKETCH

# Interaction

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
        
**@ + TYPE (Autocompletion while typing)** - give access to all the other QuakeML types    
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

## Page

**1** - Previous page
**2** - Next page

## View mode

**t** - toggle beween waveform and travel time model (distance - travel time)

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