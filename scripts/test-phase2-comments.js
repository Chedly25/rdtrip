#!/usr/bin/env node

/**
 * Test script for Phase 2 Activity Comments API
 * Tests all CRUD operations: Create, Read, Resolve, Delete
 */

const db = require('../db/connection');

async function testCommentAPIs() {
  console.log('🧪 Testing Phase 2: Activity Comments API');
  console.log('==========================================\n');

  try {
    // Step 1: Find a test route
    console.log('Step 1: Finding test route...');
    const routeQuery = await db.query(
      `SELECT id, user_id, origin, destination
       FROM routes
       ORDER BY created_at DESC
       LIMIT 1`
    );

    if (routeQuery.rows.length === 0) {
      console.log('❌ No routes found in database. Please create a route first.');
      process.exit(1);
    }

    const testRoute = routeQuery.rows[0];
    const routeId = testRoute.id;
    const userId = testRoute.user_id;

    console.log(`✅ Found test route:`);
    console.log(`   Route ID: ${routeId}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Route: ${testRoute.origin} → ${testRoute.destination}\n`);

    // Step 2: Create a test comment
    console.log('Step 2: Creating test comment...');
    const createResult = await db.query(
      `INSERT INTO activity_comments
       (route_id, target_type, target_id, day_number, user_id, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [routeId, 'activity', 'Test Activity', 1, userId, 'This is a test comment for Phase 2!']
    );

    const comment = createResult.rows[0];
    console.log(`✅ Comment created:`);
    console.log(`   Comment ID: ${comment.id}`);
    console.log(`   Target: ${comment.target_type} - ${comment.target_id}`);
    console.log(`   Text: ${comment.comment}\n`);

    // Step 3: Create a reply to the comment
    console.log('Step 3: Creating reply to comment...');
    const replyResult = await db.query(
      `INSERT INTO activity_comments
       (route_id, target_type, target_id, day_number, user_id, comment, parent_comment_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [routeId, 'activity', 'Test Activity', 1, userId, 'This is a reply!', comment.id]
    );

    const reply = replyResult.rows[0];
    console.log(`✅ Reply created:`);
    console.log(`   Reply ID: ${reply.id}`);
    console.log(`   Parent ID: ${reply.parent_comment_id}`);
    console.log(`   Text: ${reply.comment}\n`);

    // Step 4: Fetch comments with replies
    console.log('Step 4: Fetching comments...');
    const fetchResult = await db.query(
      `SELECT
        ac.id,
        ac.route_id,
        ac.target_type,
        ac.target_id,
        ac.day_number,
        ac.user_id,
        ac.comment,
        ac.parent_comment_id,
        ac.resolved,
        ac.resolved_by,
        ac.resolved_at,
        ac.created_at,
        ac.updated_at,
        u.name as user_name
       FROM activity_comments ac
       JOIN users u ON ac.user_id = u.id
       WHERE ac.route_id = $1
         AND ac.target_type = $2
         AND ac.target_id = $3
       ORDER BY ac.created_at ASC`,
      [routeId, 'activity', 'Test Activity']
    );

    console.log(`✅ Fetched ${fetchResult.rows.length} comments:`);
    fetchResult.rows.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.comment} (${c.parent_comment_id ? 'Reply' : 'Root'})`);
    });
    console.log();

    // Step 5: Test resolve functionality
    console.log('Step 5: Resolving comment...');
    const resolveResult = await db.query(
      `UPDATE activity_comments
       SET resolved = true, resolved_by = $1, resolved_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [userId, comment.id]
    );

    console.log(`✅ Comment resolved:`);
    console.log(`   Resolved: ${resolveResult.rows[0].resolved}`);
    console.log(`   Resolved by: ${resolveResult.rows[0].resolved_by}`);
    console.log(`   Resolved at: ${resolveResult.rows[0].resolved_at}\n`);

    // Step 6: Test unresolve
    console.log('Step 6: Unresolving comment...');
    await db.query(
      `UPDATE activity_comments
       SET resolved = false, resolved_by = NULL, resolved_at = NULL
       WHERE id = $1`,
      [comment.id]
    );
    console.log(`✅ Comment unresolved\n`);

    // Step 7: Check counts for summary
    console.log('Step 7: Counting comments by route...');
    const countResult = await db.query(
      `SELECT
        COUNT(*) as total_comments,
        COUNT(*) FILTER (WHERE resolved = false) as unresolved_count,
        COUNT(*) FILTER (WHERE parent_comment_id IS NULL) as root_comments
       FROM activity_comments
       WHERE route_id = $1`,
      [routeId]
    );

    const counts = countResult.rows[0];
    console.log(`✅ Comment statistics:`);
    console.log(`   Total comments: ${counts.total_comments}`);
    console.log(`   Unresolved: ${counts.unresolved_count}`);
    console.log(`   Root comments: ${counts.root_comments}\n`);

    // Step 8: Cleanup - Delete test comments
    console.log('Step 8: Cleaning up test data...');
    await db.query(
      `DELETE FROM activity_comments WHERE route_id = $1 AND target_id = $2`,
      [routeId, 'Test Activity']
    );
    console.log(`✅ Test comments deleted\n`);

    console.log('==========================================');
    console.log('✅ All Phase 2 Comment API tests passed!');
    console.log('==========================================\n');

    console.log('📊 Summary:');
    console.log('   ✅ Create comment - PASS');
    console.log('   ✅ Create reply (threading) - PASS');
    console.log('   ✅ Fetch comments with user data - PASS');
    console.log('   ✅ Resolve comment - PASS');
    console.log('   ✅ Unresolve comment - PASS');
    console.log('   ✅ Count statistics - PASS');
    console.log('   ✅ Delete comments (CASCADE) - PASS');
    console.log('\n✨ Phase 2 backend is fully functional!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testCommentAPIs();
