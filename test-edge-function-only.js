#!/usr/bin/env node

// Test deployed Edge Function without affecting frontend
const EDGE_FUNCTION_URL = "https://gpcfhhwasgnzvhnnaogq.supabase.co/functions/v1/display"

const testEdgeFunction = async () => {
  console.log('🧪 Testing deployed Edge Function...')
  console.log('📡 URL:', EDGE_FUNCTION_URL)
  console.log()

  const tests = [
    {
      name: 'Single Zone Test',
      params: 'Zone=2&Msg=Hello%20Test&Duration=5&Anim=fade'
    },
    {
      name: 'Multiple Zones Test',
      params: 'Zone=1,3,4&Msg=Multi%20Zone%20Test&Duration=8&Anim=scroll'
    },
    {
      name: 'Invalid Zone Test (should fail)',
      params: 'Zone=5&Msg=Invalid&Duration=5'
    },
    {
      name: 'Missing Parameters Test (should fail)',
      params: 'Zone=1'
    }
  ]

  for (const test of tests) {
    console.log(`🔍 ${test.name}`)
    console.log(`📋 Parameters: ${test.params}`)
    
    try {
      const response = await fetch(`${EDGE_FUNCTION_URL}?${test.params}`, {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log('✅ Success:', result.message)
        if (result.data) {
          console.log('📄 Data:', {
            id: result.data.id,
            zones: result.data.zones,
            message: result.data.message,
            duration: result.data.duration
          })
        }
      } else {
        console.log('❌ Error:', result.error)
        if (result.message) console.log('💬 Details:', result.message)
      }
    } catch (error) {
      console.log('💥 Request failed:', error.message)
    }
    
    console.log('---')
  }
}

testEdgeFunction().catch(console.error)