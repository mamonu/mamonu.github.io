---
layout: single
title: "Unit Testing using Property Based Tests"
header:
  overlay_image: https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/cropped-bd1.jpg
  overlay_filter: 0.75
  teaser: https://github.com/mamonu/mamonu.github.io/raw/master/assets/hypt/cropped-bd1.jpg
date:   06-06-2019 06:58:07 +0000
---



Another test philosophy introduced by QuickCheck

Property based testing has become quite famous in the functional world. 
Mainly introduced by QuickCheck framework in Haskell, it suggests another way to test software. 
It targets all the scope covered by example based testing: from unit tests to integration tests.

Property-based Testing 
Complementary to traditional example-based testing 
Specify post-conditions that must hold no matter what 
Encourages the programmer to think harder about the code 
More declarative 
Need data generators to produce inputs 
Free reproducers! Good property-based testing
frameworks shrink inputs to minimal automatically 
Famous: Haskell’s QuickCheck, Scala’s ScalaTest


Lets try to test a simple calculator app in Python

The App in all its glory

![calc app](https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/hypt/calcs.png)




Tests run using pytest

without hypothesis:

<img src="https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/hypt/before_hypothesis.svg?sanitize=true">


using Property-Based-Testing with hypothesis module

<img src="https://raw.githubusercontent.com/mamonu/mamonu.github.io/master/assets/hypt/after_hypothesis.svg?sanitize=true">
