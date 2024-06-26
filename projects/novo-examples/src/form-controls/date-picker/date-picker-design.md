---
section: Form Controls
page: Date Picker
title: Design
order: 2
---

## Usage

<novo-grid columns="2" align="start" gap="2rem">
<div>

Date Pickers allow users to easily select a date. It comes in a handful of varieties based on the content of the field.

</div>

![DatePicker](assets/images/DatePickerOverview.png)

</novo-grid>

## Best Practices

- Use when a single date selection is required from the user, especially when additional context is around the date selection is needed. e.g. selecting a date within a specific date range.
- Always use `novo-date-picker-input` when part of a larger form.
- Only use standalone `date-picker` as filter for content displayed on the page.

## Anatomy

<novo-grid columns="2" align="start" gap="2rem">

![DatePicker Anatomy](assets/images/DatePickerOverview.png){width=450}

<div>

1. **Container**<br>
   Defines the layout for the form field (horizontal vs vertical)

1. **Input Prefix (Optional element)**<br>
   An element/icon displayed before the input. eg. \$

1. **Label**<br>
   A label for a group of menu actions.

1. **Input Control**<br>
   The element representing the input control: `input`, `select`, etc...

1. **Input Suffix (Optional element)**<br>
   The element/icon displayed after the input. eg. calendar icon for date picker.

1. **Helper/Error text (Optional element)**<br>
   Caption text to display helpful information, warnings, or errors.

</div>
</novo-grid>

## Best Practices

- Use spinner to display that an action invoked by the user is performing but not complete.
- Use loading when loading data from the server to intialize content.
- If a spinner is triggered by a button, place the spinner in the button, and disable the button while the spinner is visible.
- If only a portion of a page is loading new content or being updated, place the loading element in that part of the page.
- There should only be a single loading element on a page at one time.

## Accessibility

**Implementation**

Always include an `alt` attribute describing the information that is visually displayed in the image.
