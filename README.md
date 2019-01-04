# Purpose of Waveform UI

- Visualize waveforms
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