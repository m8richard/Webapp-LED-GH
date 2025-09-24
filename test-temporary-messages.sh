#!/bin/bash

# Test script for temporary messages system
EDGE_FUNCTION_URL="https://gpcfhhwasgnzvhnnaogq.supabase.co/functions/v1/display"

echo "🧪 Testing Temporary Messages System"
echo "📡 Edge Function URL: $EDGE_FUNCTION_URL"
echo ""

# Test 1: Single zone message
echo "🔵 Test 1: Single zone message (Zone 2, fade animation)"
curl -X POST "$EDGE_FUNCTION_URL?Zone=2&Msg=Hello%20Zone%202&Duration=10&Anim=fade"
echo -e "\n"

sleep 2

# Test 2: Multiple zones message  
echo "🌈 Test 2: Multiple zones message (Zones 1,3,4, scroll animation)"
curl -X POST "$EDGE_FUNCTION_URL?Zone=1,3,4&Msg=Emergency%20Exit&Duration=15&Anim=scroll"
echo -e "\n"

sleep 2

# Test 3: Slide animation
echo "🎬 Test 3: Slide animation (Zone 3)"
curl -X POST "$EDGE_FUNCTION_URL?Zone=3&Msg=Sliding%20Message&Duration=8&Anim=slide"
echo -e "\n"

sleep 2

# Test 4: No animation
echo "⚪ Test 4: No animation (Zone 4)"
curl -X POST "$EDGE_FUNCTION_URL?Zone=4&Msg=Static%20Message&Duration=12&Anim=none"
echo -e "\n"

sleep 2

# Test 5: All zones at once
echo "🎯 Test 5: All zones at once"
curl -X POST "$EDGE_FUNCTION_URL?Zone=1,2,3,4&Msg=SYSTEM%20ALERT&Duration=20&Anim=fade"
echo -e "\n"

echo "✅ All tests completed!"
echo ""
echo "💡 Your deployed Vercel URL format:"
echo "  https://your-app.vercel.app/api/display?Zone=1,3,4&Msg=Emergency%20Exit&Duration=15&Anim=scroll"
echo ""
echo "🎮 Animation types:"
echo "  - fade: Fades in/out"
echo "  - slide: Slides in from right, out to left"  
echo "  - scroll: Scrolls across the zone"
echo "  - none: Static display"