<script setup>
	const cards = [
		{ name: 'hud name',     price: 300, desc: 'some poker hud',    img:'/img/poker_hud_1.png'},
		{ name: "some_name",    price: 200, desc: 'description space', img:'/img/poker_hud_1.png'},
		{ name: "some_name",    price: 100, desc: 'some other hud',    img:'/img/poker_hud_2.png'},
		{ name: "some_name",    price: 320, desc: 'some descriptn',    img:'/img/poker_hud_3.webp'},
		{ name: "some_name",    price: 300, desc: 'sup',               img:'/img/poker_hud_2.png'},
		{ name: "some_name",    price: 500, desc: 'sup',               img:'/img/poker_hud_1.png'},
		{ name: "some_name",    price: 300, desc: 'sup',               img:'/img/poker_hud_1.png'},
		{ name: "some_name",    price: 300, desc: 'sup',               img:'/img/poker_hud_2.png'},
		{ name: "some_name",    price: 300, desc: 'sup',               img:'/img/poker_hud_1.png'},
		{ name: "some_name",    price: 300, desc: 'sup',               img:'/img/poker_hud_1.png'},
		{ name: "some_name",    price: 300, desc: 'sup',               img:'/img/poker_hud_1.png'},
		{ name: "some_name",    price: 300, desc: 'sup',               img:'/img/poker_hud_1.png'}
	];

	// const categories = [ "GTO", "MDA", "Software", "Courses", "Cash", "MTT", "Spins", "PLO", "6+"];


</script>

<template>
	<div class="page global-container">
		<div class="type-selector">
			<h1 class="type type-fifth">MDA</h1>
			<h1 class="type type-fourth">GTO</h1>
			<h1 class="type type-third">Software</h1>
			<h1 class="type type-second">Courses</h1>
			<h1 class="type type-main">Cash</h1>
			<h1 class="type type-second">MTT</h1>
			<h1 class="type type-third">Spins</h1>
			<h1 class="type type-fourth">PLO</h1>
			<h1 class="type type-fifth">6+</h1>
		</div>
		<div class="main">
			<div class="page-section left-side">
				<div class="left-side-container">
					<div class="desc">
						<h1>Cash games</h1>
						<p>Cash games hand picked by the hands of some very smart people deffo</p>
					</div>

					<hr style=": 2rem 0;">
					<div class="search-options">
												
						<div class="sorting filter-opt">
							<h2 class="filter-h2">Sort by</h2>
							<div class="sorting-opts">
								<p class="sorting-opt selected"> <Icon name="material-symbols:leaderboard"/><span>Popularity</span></p>
								<p class="sorting-opt"> <Icon name="material-symbols:trending-down"/><span style="display:none;">Cheaper first</span></p>
								<p class="sorting-opt"> <Icon name="material-symbols:trending-up"/><span style="display:none;">Expensive first</span></p>
								<p class="sorting-opt"> <Icon name="material-symbols:schedule"/><span style="display:none;">New</span></p>
								<p class="sorting-opt"> <Icon name="material-symbols:history"/><span style="display:none;">Old</span></p>
							</div>
						</div>

						<div class="filter-opt price-filter">
							<h2 class="filter-h2">Price range</h2>
							<div class="price-min-max">
								<GlobalTxtInput placeholder="From"/>
								<GlobalTxtInput placeholder="To"/>
							</div>	
						</div>

						<div class="filter-opt price-filter">
							<h2 class="filter-h2">Type</h2>
							<div class="price-min-max">
								<GlobalTxtInput placeholder="^"/>
							</div>	
						</div>
						
					</div>
				</div>
			</div>
			<div class="page-section right-side">
				<div class="offer-card" v-for="card in cards">
					<div class="card-backdrop" :style="{backgroundImage : `linear-gradient(#0000, #0006), url(${card.img})`}"/>
					<div class="card-info">
						<div class="card-info-container">
							<div class="card-top-part">
								<p class="card-title">{{card.name}}</p>
								<h1 class="card-price">{{card.price}}$</h1>
							</div>
							<p class="card-desc">{{card.desc}}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
	.page {
		--global-gap: var(--default-gap);
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--global-gap);
		padding-top: 2rem;
	}

	.main {
		display: flex;
		align-items: center;
		gap: var(--global-gap);
		width: 100%;
	}

	.page-section { height: 80vh; }

	.left-side {
		background: var(--background-secondary);
		box-shadow: .8rem .5rem 3rem #0008;
		flex-shrink: 0;
		width: 25%;
	}

	.left-side-container {
		padding: 2rem; 
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: calc(100% - 4rem);
	}

	.right-side {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
		gap: var(--global-gap);
		overflow: auto;
		scrollbar-color: var(--primary-clr-2) var(--background-secondary);
		padding-right: var(--global-gap);
	}

	.type-selector {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: calc(100% - 4rem);
		background: var(--background-secondary);
		box-shadow: .8rem .5rem 3rem #0008;
		padding: 0 2rem;
	}

	.type {
		text-align: center;
		font-weight: 100;
		padding: 1rem 0;
	}

	.type-main {   font-size: 2rem;   width: 15%; 
		font-weight: 800; 
		color: var(--primary-clr-1);
		border-bottom: 2px solid var(--primary-clr-1)
	}
	.type-second { font-size: 1.8rem; width: 10%;}
	.type-third  { font-size: 1.6rem; width: 8%; }
	.type-fourth { font-size: 1.4rem; width: 6%; }
	.type-fifth  { font-size: 1.2rem; width: 4%; }

	.offer-card {
		flex: 1 1 30%;
		height: 20rem;
		background: var(--background-secondary);
		box-shadow: .8rem .5rem 3rem #0008;
		border: 1px solid var(--background-secondary);
		transition: all 300ms ease, transform 150ms ease;
	}

	.offer-card:hover {
		border-color: var(--primary-clr-1);
	  transform: scale(1.05);
	}

	.card-backdrop {
		width: 100%;
		height: 70%;
		background-size: cover;
		background-position: center;
		border-bottom: 1px solid var(--primary-clr-1);
	}

	.card-info {
		width: 100%;
		flex-grow: 1;
	}

	.card-info-container { padding: 20px; }

	.card-top-part {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.card-title, .card-price { font-size: 1.3rem; }
	.card-price { color: var(--primary-clr-1); }


	.search-options {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.filter-h2 {
		text-align: center;
	}

	.price-min-max {
		display: flex;
		width: 100%;
		gap: var(--global-gap);
		margin-top: .8rem;
	}

	.price-min-max input {
		width: 100%;
	}

	.sorting-opts {
		display: flex;
	}

	.sorting-opt {
		padding: 0.4rem;
		font-size: 1.2rem;
		border-bottom: 1px solid var(--primary-clr-2);

		display: flex;
		gap: .4rem;
		align-items: center;
	}

	.sorting-opt.selected {
		width: 100%;
		color: var(--primary-clr-1);
		border-color: var(--primary-clr-1);
	}

</style>
