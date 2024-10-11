<?php

$curdir = dirname(__FILE__);
include_once ($curdir."/../../../../static_lib.php");
include_once ('../../../core/MCore.php');
MCore::init();

$conn = StaticLib::db_connection();
$response = StaticLib::startPage();

$method = $_SERVER['REQUEST_METHOD'];

if (in_array($method, ['GET', 'PATCH', 'PUT'])) handleResponse(404, 'Invalid request method: '.$method);

if ($method === 'POST') {
	$data = json_decode(file_get_contents('php://input'), true);

	if (!$data) handleResponse(400, 'Missing payload in POST request');

	$eventType = $data['type'];

	switch ($eventType) {
		case 'checkout.session.completed':
			handleCheckoutSessionCompleted($data['data']['object']);
			break;
		default:
			handleResponse(200, 'Event not processed: '.$eventType);
	}

	handleResponse(200, "Event Type: ".$eventType);
}

function handleCheckoutSessionCompleted($obj) {
	$sessionId = $obj['id'];
	$lineItems = getCheckoutSessionLineItems($sessionId);
	
	if (empty($lineItems['data'])) handleResponse(400, 'No products found for session ID: '.$sessionId);

	$email = null;
	$productNames = [];
	$productQuantities = [];

	if (isset($obj['custom_fields']) && is_array($obj['custom_fields'])) {
		foreach ($obj['custom_fields'] as $field) {
			if (isset($field['key']) && $field['key'] === 'emailusedforvsaaswebclient') {
				$email = $field['text']['value'] ?? null;
				break;
			}
		}
	}

	foreach ($lineItems['data'] as $item) {
		$productDescription = $item['description'];
		$productNames[] = $productDescription;
		$productQuantities[$productDescription] = $item['quantity'];
	}

	
	if (empty($email)) handleResponse(400, 'No vsaas email provided found in the session.');
	if (empty($productNames)) handleResponse(400, 'No product names found in the session.');
	if (empty($productQuantities)) handleResponse(400, 'No product quantities found in the session.');
	
	updateUserPlans($email, $productNames, $productQuantities);
	handleResponse(200, "Checkout Session Completed\n\tEmail: ".$email."\n\tProducts: ".implode(', ', $productNames));
}

function updateUserPlans($email, $productNames, $productQuantities) {
	// TODO add ID to prdouct metadata so no need to map
	$productNameToPlanIdMap = [
		'30-days recording package for 1 year' => 'CR30',
		'30-days recording package for 1 year with AI by event' => 'CR30_BE',
	];

	// TODO check if user is admin?
	$userPlans = json_decode(getUserPlansByEmail($email), true) ?? [];
	$productQuantityMap = [];
	$existingPlansIds = array_column($userPlans, 'id');

	// get quantity for each plan
	foreach ($productNames as $productName) {
		if (array_key_exists($productName, $productNameToPlanIdMap)) {
			$planId = $productNameToPlanIdMap[$productName];
			$productQuantityMap[$planId] = $productQuantities[$productName];
		}
	}

	// update existing plan
	foreach ($userPlans as &$userPlan) {
		$planId = $userPlan['id'];
		if (isset($productQuantityMap[$planId])) {
			$userPlan['count'] = (int)$userPlan['count'] + (int)$productQuantityMap[$planId];
			unset($productQuantityMap[$planId]);
		}
	}

	// create new plan
	foreach ($productQuantityMap as $planId => $quantity) {
		if (!in_array($planId, $existingPlansIds)) {
			$plan = createUserPlanObject($planId, $quantity);
			if (!$plan) handleResponse(400, 'Plan not found: ' . $planId);
			$userPlans[] = $plan;
		}
	}

	updateUserPlansByEmail($email, json_encode($userPlans));
}

function getCheckoutSessionLineItems($sessionId) {
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, "https://api.stripe.com/v1/checkout/sessions/$sessionId/line_items");
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . MCore::$core->config['stripe_api_key']]);
	$result = curl_exec($ch);
	curl_close($ch);
	return json_decode($result, true);
}

function createUserPlanObject($planId, $quantity) {
	switch ($planId) {
		case 'CR30':
			return (object)[
				'id' => 'CR30',
				'name' => '30 Day Continuous Recording',
				'used' => 0,
				'count' => $quantity
			];
		case 'CR30_BT':
			return (object)[
				'id' => 'CR30_BE',
				'name' => '30 day Continued Rec-AI by Event',
				'used' => 0,
				'count' => $quantity
			];
		default:
			return null;
	}
}

function getUserPlansByEmail($email) {
	return fetchRow('SELECT "plans" from "user" WHERE "email"=?', [$email])['plans'] ?? null;
}

function updateUserPlansByEmail($email, $updatedUserPlansJson) {
	MCore::$core->pdo->prepare('UPDATE "user" SET "plans"=? WHERE "email"=?')->execute([$updatedUserPlansJson, $email]);
}

function handleResponse($httpCode, $message) {
	$response['httpcode'] = $httpCode;
	StaticLib::endPage($response);
	exit();
}
