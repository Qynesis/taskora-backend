/**
 * Australian suburbs (localities) with postcodes, by state, for the location picker.
 *
 * GENERATED from the "Delivery Area" rows of schappim/australian-postcodes
 * (australian-postcodes.csv, snapshot 2026-05-27). Do not edit by hand — regenerate.
 *
 * Grain is (name, state, postcode), which is the grain of Australian addressing. A name is
 * NOT unique within a state: "Back Creek" is six distinct NSW localities on six postcodes,
 * "Mayfield" is four. Collapsing on name alone would silently merge different places, so
 * each (name, postcode) pair is its own row and callers disambiguate by postcode.
 *
 * Post Office Box rows are excluded: they are mail-handling ranges, not places anyone lives.
 *
 * Two entries are added by hand — "O'Connor" in ACT (2602) and WA (6163). That dataset holds
 * no apostrophes in any of its 16,511 rows and omits apostrophe localities outright rather
 * than transliterating them (O'Halloran Hill, O'Sullivan Beach, O'Malley and D'Aguilar are
 * likewise absent), so it silently loses real suburbs. Both were in the previous curated seed.
 *
 * Each line is "<postcode> <name>" — newline-delimited template literals rather than object
 * literals purely for scale: at ~16k entries this is far smaller and compiles much faster
 * than 16k separate literal nodes. Parsed once at module load.
 */

export type SuburbSeed = { name: string; postcode: string };

const ACT = `2601 Acton
2602 Ainslie
2914 Amaroo
2614 Aranda
2906 Banks
2600 Barton
2620 Beard
2617 Belconnen
2617 Belconnen Dc
2914 Bonner
2905 Bonython
2620 Booth
2612 Braddon
2617 Bruce
2905 Calwell
2612 Campbell
2600 Canberra
2601 Canberra
2609 Canberra Airport
2600 Capital Hill
2913 Casey
2604 Causeway
2611 Chapman
2615 Charnwood
2606 Chifley
2905 Chisholm
2601 City
2906 Conder
2614 Cook
2611 Coombs
2611 Coree
2911 Crace
2605 Curtin
2600 Deakin
2600 Deakin West
2611 Denman Prospect
2602 Dickson
2602 Downer
2611 Duffy
2615 Dunlop
2903 Erindale Centre
2617 Evatt
2904 Fadden
2607 Farrer
2611 Fisher
2615 Florey
2615 Flynn
2914 Forde
2603 Forrest
2913 Franklin
2615 Fraser
2609 Fyshwick
2605 Garran
2905 Gilmore
2617 Giralang
2906 Gordon
2904 Gowrie
2900 Greenway
2603 Griffith
2912 Gungahlin
2602 Hackett
2618 Hall
2600 Harman
2914 Harrison
2614 Hawker
2615 Higgins
2540 Hmas Creswell
2600 Hmas Harman
2611 Holder
2615 Holt
2605 Hughes
2620 Hume
2607 Isaacs
2905 Isabella Plains
2914 Jacka
2614 Jamison Centre
2540 Jervis Bay
2617 Kaleen
2902 Kambah
2902 Kambah Village
2911 Kenny
2604 Kingston
2615 Kippax
2620 Kowen
2615 Latham
2617 Lawson
2602 Lyneham
2606 Lyons
2904 Macarthur
2615 Macgregor
2615 Macnamara
2614 Macquarie
2609 Majura
2603 Manuka
2607 Mawson
2617 McKellar
2615 Melba
2911 Mitchell
2611 Molonglo
2904 Monash
2914 Moncrieff
2604 Narrabundah
2913 Ngunnawal
2913 Nicholls
2602 O'Connor
2620 Oaks Estate
2903 Oxley
2620 Paddys River
2614 Page
2913 Palmerston
2600 Parkes
2607 Pearce
2606 Phillip
2609 Pialligo
2603 Red Hill
2612 Reid
2905 Richardson
2611 Rivett
2600 Russell
2614 Scullin
2615 Spence
2611 Stirling
2615 Strathnairn
2611 Stromlo
2609 Symonston
2913 Taylor
2620 Tennent
2620 Tharwa
2905 Theodore
2914 Throsby
2607 Torrens
2612 Turner
2617 University Of Canberra
2611 Uriarra Village
2903 Wanniassa
2611 Waramanga
2602 Watson
2614 Weetangera
2611 Weston
2611 Weston Creek
2611 Whitlam
2620 Williamsdale
2606 Woden
2540 Wreck Bay
2611 Wright
2600 Yarralumla`;

const NSW = `2850 Aarons Pass
2176 Abbotsbury
2046 Abbotsford
2795 Abercrombie
2795 Abercrombie River
2325 Aberdare
2336 Aberdeen
2350 Aberfoyle
2320 Aberglasslyn
2326 Abermain
2325 Abernethy
2350 Abington
2476 Acacia Creek
2763 Acacia Gardens
2629 Adaminaby
2289 Adamstown
2289 Adamstown Heights
2729 Adelong
2727 Adjungbilly
2474 Afterlee
2753 Agnes Banks
2560 Airds
2546 Akolele
2873 Albert
2527 Albion Park
2527 Albion Park Rail
2640 Albury
2440 Aldavilla
2870 Alectown
2015 Alexandria
2234 Alfords Point
2650 Alfredtown
2469 Alice
2259 Alison
2420 Alison
2100 Allambie Heights
2320 Allandale
2218 Allawah
2671 Alleena
2441 Allgomera
2425 Allworth
2311 Allynbrook
2659 Alma Park
2575 Alpine
2477 Alstonvale
2477 Alstonville
2460 Alumy Creek
2866 Amaroo
2560 Ambarvale
4380 Amosfield
2648 Anabranch North
2648 Anabranch South
2320 Anambah
2631 Ando
2621 Anembo
2550 Angledale
2834 Angledool
2629 Anglers Reach
2464 Angourie
2765 Angus
2316 Anna Bay
2038 Annandale
2156 Annangrove
2560 Appin
2850 Apple Tree Flat
2340 Appleby
2330 Appletree Flat
2820 Apsley
2630 Arable
2431 Arakoon
2622 Araluen
2714 Aratula
2159 Arcadia
2283 Arcadia Vale
2338 Ardglen
2358 Arding
2665 Ardlethan
2720 Argalong
2284 Argenton
2449 Argents Hill
2707 Argoon
2350 Argyle
2665 Ariah Park
2795 Arkell
2795 Arkstone
2828 Armatree
2350 Armidale
2350 Armidale Dc
2205 Arncliffe
2148 Arndell Park
2456 Arrawarra
2456 Arrawarra Headland
2064 Artarmon
2820 Arthurville
2715 Arumpo
2193 Ashbury
2463 Ashby
2463 Ashby Heights
2463 Ashby Island
2168 Ashcroft
2131 Ashfield
2361 Ashford
2400 Ashley
2650 Ashmont
2323 Ashtonfield
2077 Asquith
2361 Atholwood
2345 Attunga
2144 Auburn
2360 Auburn Vale
2232 Audley
2515 Austinmer
2179 Austral
2440 Austral Eden
2890 Australian Defence Forces
2107 Avalon Beach
2850 Avisford
2577 Avoca
2251 Avoca Beach
2574 Avon
2530 Avondale
2628 Avonside
2283 Awaba
2575 Aylmerton
2390 Baan Baa
2825 Babinda
2470 Babyl Creek
2372 Back Creek
2390 Back Creek
2422 Back Creek
2484 Back Creek
2622 Back Creek
2671 Back Creek
2535 Back Forest
2470 Backmede
2365 Backwater
2540 Badagarang
2555 Badgerys Creek
2630 Badja
2333 Baerami
2333 Baerami Creek
2446 Bagnoo
2446 Bago
2477 Bagotville
2359 Bakers Creek
2422 Bakers Creek
2447 Bakers Creek
2820 Bakers Swamp
2575 Balaclava
2358 Balala
2264 Balcolyn
2365 Bald Blair
2549 Bald Hills
2370 Bald Nob
2795 Bald Ridge
2365 Baldersleigh
2867 Baldry
2403 Balfours Peak
2093 Balgowlah
2093 Balgowlah Heights
2519 Balgownie
2324 Balickera
2822 Balladoran
2622 Ballalaba
2646 Balldale
2441 Ballengarra
2830 Ballimore
2478 Ballina
2478 Ballina Dc
2795 Ballyroe
2041 Balmain
2041 Balmain East
2283 Balmoral
2571 Balmoral Village
2715 Balranald
2540 Bamarang
2446 Banda Banda
2420 Bandon Grove
2729 Bangadang
2541 Bangalee
2479 Bangalow
2404 Bangheet
2582 Bango
2234 Bangor
2216 Banksia
2019 Banksmeadow
2200 Bankstown
2200 Bankstown Aerodrome
2200 Bankstown North
2200 Bankstown Square
2580 Bannaby
2580 Bannister
2347 Banoon
2486 Banora Point
2460 Banyabba
2300 Bar Beach
2083 Bar Point
2850 Bara
2396 Baradine
2000 Barangaroo
2460 Barcoongere
2234 Barden Ridge
2565 Bardia
2207 Bardwell Park
2207 Bardwell Valley
2665 Barellan
2574 Bargo
2732 Barham
2850 Barigan
2556 Barker
2474 Barkers Vale
2668 Barmedman
2852 Barneys Reef
2278 Barnsley
3644 Barooga
2347 Barraba
2528 Barrack Heights
2528 Barrack Point
2441 Barraganyatti
2546 Barragga Bay
2710 Barratta
2577 Barren Grounds
2577 Barrengarry
2460 Barretts Creek
2540 Barringella
2422 Barrington
2422 Barrington Tops
2840 Barringun
2340 Barry
2799 Barry
2594 Barwang
2396 Barwon
2460 Baryulgil
2540 Basin View
2197 Bass Hill
2365 Bassendean
2439 Batar Creek
2261 Bateau Bay
2536 Batehaven
2536 Batemans Bay
2795 Bathampton
2795 Bathurst
2795 Bathurst West
2730 Batlow
2153 Baulkham Hills
2580 Baw Baw
2539 Bawley Point
2422 Baxters Ridge
2261 Bay Village
2104 Bayview
2100 Beacon Hill
2015 Beaconsfield
2469 Bean Creek
2827 Bearbong
2577 Beaumont
2155 Beaumont Hills
2665 Beckom
2340 Bective
2665 Bectric
2871 Bedgerabong
2446 Beechwood
2119 Beecroft
2540 Beecroft Peninsula
2680 Beelbangera
2824 Beemunnel
2550 Bega
2587 Beggan Beggan
2577 Belanglo
2422 Belbora
2191 Belfield
2335 Belford
2650 Belfrayden
2800 Belgravia
2570 Belimbla Park
2786 Bell
2153 Bella Vista
2518 Bellambi
2446 Bellangry
2397 Bellata
2535 Bellawongarah
2325 Bellbird
2325 Bellbird Heights
2440 Bellbrook
2023 Bellevue Hill
2440 Bellimbopinni
2454 Bellingen
2581 Bellmount Forest
2337 Belltrees
2280 Belmont
2280 Belmont North
2280 Belmont South
2192 Belmore
2440 Belmore River
2628 Beloka
2787 Beloon
2545 Belowra
2085 Belrose
2085 Belrose West
2550 Bemboka
2790 Ben Bullen
2365 Ben Lomond
2536 Benandarah
2539 Bendalong
2355 Bendemeer
2803 Bendick Murrell
2420 Bendolba
2622 Bendoura
2680 Benerembah
2333 Bengalla
2290 Bennetts Green
2818 Benolong
2251 Bensville
2480 Bentley
2141 Berala
2758 Berambing
2322 Beresfield
2537 Bergalia
2506 Berkeley
2261 Berkeley Vale
2765 Berkshire Park
2622 Berlang
2546 Bermagui
2081 Berowra
2082 Berowra Creek
2082 Berowra Heights
2082 Berowra Waters
2548 Berrambool
2540 Berrara
2582 Berremangra
2422 Berrico
2628 Berridale
2390 Berrigal
2712 Berrigan
2159 Berrilee
2577 Berrima
2539 Berringer Lake
2535 Berry
2701 Berry Jerry
2535 Berry Mountain
2321 Berry Park
2594 Berthong
2852 Beryl
2590 Bethungra
2581 Bevendale
2217 Beverley Park
2209 Beverly Hills
2540 Bewong
2480 Bexhill
2207 Bexley
2207 Bexley North
2207 Bexley South
2581 Biala
2632 Bibbenluke
2570 Bickley Vale
2827 Biddon
2642 Bidgeemia
2770 Bidwill
2453 Bielsdown Hills
2579 Big Hill
2339 Big Jacks Creek
2330 Big Ridge
2650 Big Springs
2330 Big Yengo
2583 Bigga
2486 Bilambil
2486 Bilambil Heights
2680 Bilbul
2107 Bilgola Beach
2107 Bilgola Plateau
2829 Billeroy
2630 Billilingra
2804 Billimari
2483 Billinudgel
2453 Billys Creek
2795 Billywillinga
2758 Bilpin
2611 Bimberi
2810 Bimbi
2536 Bimbimbie
2787 Bimlow
2584 Binalong
2583 Binda
2422 Bindera
2787 Bindook
2404 Bingara
2469 Bingeebeebra Creek
2537 Bingie
2311 Bingleburra
2399 Biniguy
2630 Binjura
2479 Binna Burra
2395 Binnaway
2665 Binya
2041 Birchgrove
2446 Birdwood
2710 Birganbigil
2287 Birmingham Gardens
2844 Birriwa
2143 Birrong
2326 Bishops Bridge
2340 Bithramere
2439 Black Creek
2729 Black Creek
2430 Black Head
2322 Black Hill
2828 Black Hollow
2365 Black Mountain
2550 Black Range
2787 Black Springs
2283 Blackalls Park
2529 Blackbutt
2770 Blackett
2785 Blackheath
2790 Blackmans Flat
2444 Blackmans Point
2281 Blacksmiths
2148 Blacktown
2148 Blacktown Westpoint
2343 Blackville
2256 Blackwall
2560 Blair Athol
2559 Blairmount
2480 Blakebrook
2221 Blakehurst
2581 Blakney Creek
2721 Bland
2338 Blandford
2142 Blaxcell
2774 Blaxland
2774 Blaxland East
2460 Blaxlands Creek
2758 Blaxlands Ridge
2799 Blayney
2113 Blenheim Road
2756 Bligh Park
2713 Blighty
2720 Blowering
2261 Blue Bay
2624 Blue Cow
2262 Blue Haven
2480 Blue Knob
2408 Blue Nobby
2380 Blue Vale
2428 Blueys Beach
2450 Boambee
2452 Boambee East
2582 Boambolo
2316 Boat Harbour
2480 Boat Harbour
2877 Bobadah
2429 Bobin
2439 Bobs Creek
2316 Bobs Farm
2630 Bobundara
2631 Boco
2850 Bocoble
2865 Bocobra
2545 Bodalla
2820 Bodangora
2739 Boeill Creek
2826 Bogan
2876 Bogan Gate
2488 Bogangar
2849 Bogee
2409 Boggabilla
2382 Boggabri
2720 Bogong Peaks Wilderness
2390 Bohena Creek
2430 Bohnock
2629 Bolaro
2372 Bolivia
2540 Bolong
2283 Bolton Point
2320 Bolwarra
2320 Bolwarra Heights
2460 Bom Bom
2541 Bomaderry
2423 Bombah Point
2632 Bombala
2622 Bombay
2850 Bombira
2533 Bombo
2720 Bombowlee
2720 Bombowlee Creek
2650 Bomen
2357 Bomera
2469 Bonalbo
2026 Bondi
2026 Bondi Beach
2632 Bondi Forest
2022 Bondi Junction
2264 Bonnells Bay
2226 Bonnet Bay
2232 Bonnie Vale
2445 Bonny Hills
2177 Bonnyrigg
2177 Bonnyrigg Heights
2361 Bonshaw
2450 Bonville
2480 Booerie Creek
2650 Book Book
2257 Booker Bay
2582 Bookham
2372 Bookookoorara
2460 Bookram
2423 Boolambayte
2284 Boolaroo
2388 Boolcarroll
2711 Booligal
2540 Boolijah
2712 Boomanoomana
2428 Boomerang Beach
2866 Boomey
2405 Boomi
2476 Boomi Creek
2877 Boona Mount
2409 Boonal
2372 Boonoo Boonoo
2480 Boorabee Park
2284 Booragul
2425 Booral
2652 Boorga
2429 Boorganna
2350 Boorolong
2372 Boorook
2650 Boorooma
2710 Booroorban
2586 Boorowa
2430 Bootawa
2428 Booti Booti
2480 Booyong
2471 Bora Ridge
2346 Borah Creek
2343 Borambil
2650 Borambola
2474 Border Ranges
2800 Boree
2652 Boree Creek
2800 Borenore
2622 Boro
2176 Bossley Park
2453 Bostobrick
2019 Botany
2850 Botobolar
2469 Bottle Creek
2251 Bouddi
2828 Bourbah
2840 Bourke
2650 Bourkelands
2548 Bournda
2868 Bournewood
2566 Bow Bowing
2864 Bowan Park
2753 Bowen Mountain
2790 Bowenfels
2340 Bowling Alley Point
2422 Bowman
2422 Bowman Farm
2330 Bowmans Creek
2644 Bowna
2582 Bowning
2576 Bowral
2449 Bowraville
2257 Box Head
2765 Box Hill
2357 Box Ridge
2580 Boxers Creek
2551 Boydtown
2560 Bradbury
2556 Bradfield
2339 Braefield
2575 Braemar
2628 Braemar Bay
2622 Braidwood
2324 Brandy Hill
2335 Branxton
2460 Braunstone
2337 Brawboy
2484 Bray Park
2484 Brays Creek
2579 Brayton
2581 Breadalbane
2849 Breakfast Creek
2137 Breakfast Point
2540 Bream Beach
2626 Bredbo
2827 Breelong
2381 Breeza
2752 Brereton
2422 Bretti
2839 Brewarrina
2795 Brewongle
2365 Briarbrook
2594 Bribbaree
2330 Bridgman
2454 Brierfield
2216 Brighton-Le-Sands
2264 Brightwaters
2441 Bril Bril
2430 Brimbin
2611 Brindabella
2454 Brinerville
2556 Bringelly
3707 Bringenbrong
2580 Brisbane Grove
2292 Broadmeadow
2472 Broadwater
2549 Broadwater
2007 Broadway
2581 Broadway
2705 Brobenah
2830 Brocklehurst
2642 Brocklesby
2365 Brockley
2360 Brodies Plains
2848 Brogans Creek
2535 Brogers Creek
2550 Brogo
2330 Broke
2629 Broken Dam
2481 Broken Head
2880 Broken Hill
2880 Broken Hill North
2880 Broken Hill West
2446 Brombin
2024 Bronte
2656 Brookdale
2420 Brookfield
2450 Brooklana
2479 Brooklet
2083 Brooklyn
2656 Brookong
2100 Brookvale
2538 Brooman
2463 Brooms Head
2880 Broughams Gate
2535 Broughton
2535 Broughton Vale
2534 Broughton Village
2537 Broulee
2570 Brownlow Hill
2799 Browns Creek
2540 Browns Mountain
2530 Brownsville
2650 Brucedale
2875 Bruie Plains
2795 Bruinbun
2476 Brumby Plains
2540 Brundee
2722 Brungle
2722 Brungle Creek
2323 Brunkerville
2483 Brunswick Heads
2460 Brushgrove
2365 Brushy Creek
2540 Buangla
2450 Bucca
2429 Bucca Wauka
2460 Buccarumbi
2323 Buchanan
2550 Buckajo
2850 Buckaroo
2536 Buckenbowra
2630 Buckenderra
2472 Buckendoon
2250 Bucketty
2449 Buckra Bendinni
2622 Budawang
2825 Buddabadah
2849 Budden
2535 Budderoo
2720 Buddong
2850 Budgee Budgee
2262 Budgewoi
2262 Budgewoi Peninsula
2577 Budgong
2262 Buff Point
2357 Bugaldie
2632 Bukalong
2360 Bukkulla
2423 Bulahdelah
2622 Bulee
2330 Bulga
2429 Bulga Forest
2650 Bulgary
2835 Bulla
2594 Bulla Creek
2784 Bullaburra
2824 Bullagreen
2400 Bullarah
2710 Bullatale
2390 Bullawa Creek
2469 Bulldog
2516 Bulli
2422 Bulliac
2575 Bullio
2627 Bullocks Flat
2387 Bulyeroi
2794 Bumbaldry
2626 Bumbalong
2870 Bumberry
2324 Bundabah
2454 Bundagen
2578 Bundanoon
2359 Bundarra
2230 Bundeena
2343 Bundella
2823 Bundemar
2535 Bundewallah
2473 Bundjalung
2422 Bundook
2700 Bundure
2852 Bungaba
2480 Bungabbee
2486 Bungalora
2630 Bungarby
2767 Bungarribee
2469 Bungawalbin
2621 Bungendore
2580 Bungonia
2640 Bungowannah
2423 Bungwahl
2731 Bunnaloo
2337 Bunnan
2429 Bunyah
2630 Bunyan
2671 Burcher
2328 Bureen
2440 Burnt Bridge
2792 Burnt Yards
2739 Buronga
2620 Burra
2653 Burra
2722 Burra Creek
2732 Burraboi
2576 Burradoo
2795 Burraga
2550 Burragate
2570 Burragorang Valley
2650 Burrandana
2230 Burraneer
2594 Burrangong
2447 Burrapine
2577 Burrawang
2429 Burrell Creek
2386 Burren Junction
2540 Burrier
2539 Burrill Lake
2483 Burringbar
2582 Burrinjuck
2821 Burroway
2642 Burrumbuttock
2850 Burrundulla
2627 Burrungubugge
2134 Burwood
2136 Burwood Heights
2134 Burwood North
2168 Busby
2469 Busbys Flat
2259 Bushells Ridge
2283 Buttaba
2323 Buttai
2321 Butterwick
2571 Buxton
2446 Byabarra
2628 Byadbo Wilderness
2484 Byangum
2849 Bylong
2800 Byng
2831 Byrock
2481 Byron Bay
2484 Byrrill Creek
2621 Bywong
2137 Cabarita
2488 Cabarita Beach
2430 Cabbage Tree Island
2477 Cabbage Tree Island
2166 Cabramatta
2166 Cabramatta West
2629 Cabramurra
2747 Caddens
2545 Cadgee
2800 Cadia
2850 Caerleon
2424 Caffreys Flat
2446 Cairncross
2340 Calala
2460 Calamia
2527 Calderwood
2710 Caldwell
2250 Calga
2729 Califat
2710 Calimo
2308 Callaghan
2422 Callaghans Creek
2540 Callala Bay
2540 Callala Beach
2462 Calliope
2795 Caloola
2632 Cambalong
2330 Camberwell
2540 Cambewarra
2540 Cambewarra Village
2849 Camboon
2420 Cambra
2747 Cambridge Gardens
2747 Cambridge Park
2469 Cambridge Plateau
2570 Camden
2443 Camden Head
2570 Camden Park
2570 Camden South
2142 Camellia
2285 Cameron Park
2359 Camerons Creek
2469 Camira
2062 Cammeray
4385 Camp Creek
2560 Campbelltown
2560 Campbelltown North
2050 Camperdown
2194 Campsie
2318 Campvale
2281 Cams Wharf
2046 Canada Bay
2850 Canadian Lead
2835 Canbelego
2550 Candelo
2460 Cangai
2480 Caniaba
2166 Canley Heights
2166 Canley Vale
2800 Canobolas
2157 Canoelands
2825 Canonba
2804 Canowindra
2193 Canterbury
2263 Canton Beach
2577 Canyonleigh
2429 Caparra
2469 Capeen Creek
2846 Capertee
2371 Capoompeta
2623 Captains Flat
2650 Carabost
2810 Caragabal
2850 Carcalgong
2791 Carcoar
2285 Cardiff
2285 Cardiff Heights
2285 Cardiff South
2283 Carey Bay
2800 Cargo
2831 Carinda
2229 Caringbah
2229 Caringbah South
2630 Carlaminda
2118 Carlingford
2118 Carlingford Court
2118 Carlingford North
2218 Carlton
2171 Carnes Hill
2460 Carnham
2486 Carool
2343 Caroona
2311 Carrabolla
2440 Carrai
2163 Carramar
2711 Carrathool
2580 Carrick
2294 Carrington
2324 Carrington
2577 Carrington Falls
2340 Carroll
2372 Carrolls Creek
2330 Carrowbrook
2460 Carrs Creek
2460 Carrs Island
2460 Carrs Peninsula
2221 Carss Park
2168 Cartwright
2650 Cartwrights Hill
2849 Carwell
2620 Carwoola
2453 Cascade
2470 Casino
2329 Cassilis
2069 Castle Cove
2350 Castle Doyle
2154 Castle Hill
2333 Castle Rock
2068 Castlecrag
2749 Castlereagh
2487 Casuarina
2170 Casula
2170 Casula Mall
2536 Catalina
2560 Cataract
2632 Cathcart
2557 Catherine Field
2281 Catherine Hill Bay
2823 Cathundral
2756 Cattai
2339 Cattle Creek
2582 Cavan
2281 Caves Beach
2570 Cawdor
2474 Cawongla
2171 Cecil Hills
2178 Cecil Park
2259 Cedar Brush Creek
2325 Cedar Creek
2484 Cedar Creek
2429 Cedar Party
2474 Cedar Point
2424 Cells River
2021 Centennial Park
2756 Central Colo
2775 Central Macdonald
2250 Central Mangrove
2546 Central Tilba
2325 Cessnock
2325 Cessnock West
2460 Chaelundi
2259 Chain Valley Bay
2630 Chakola
2460 Chambigne
2848 Charbon
2678 Charles Sturt University
2795 Charles Sturt University
2290 Charlestown
2622 Charleys Forest
2428 Charlotte Bay
2624 Charlotte Pass
2795 Charlton
2263 Charmhaven
2430 Chatham
2787 Chatham Valley
2580 Chatsbury
2067 Chatswood
2067 Chatswood West
2469 Chatsworth
2083 Cheero Point
2119 Cheltenham
2360 Cherry Tree Hill
2126 Cherrybrook
2162 Chester Hill
2420 Chichester
2036 Chifley
2339 Chilcotts Creek
2480 Chilcotts Grass
2484 Chillingham
2487 Chinderah
2550 Chinnock
2008 Chippendale
2170 Chipping Norton
2322 Chisholm
2046 Chiswick
2261 Chittaway Bay
2261 Chittaway Point
2484 Chowan Creek
2190 Chullora
2105 Church Point
2848 Clandulla
2711 Clare
2747 Claremont Meadows
2790 Clarence
2321 Clarence Town
2756 Clarendon
2460 Clarenza
2107 Clareville
2559 Claymore
2795 Clear Creek
2620 Clear Range
2469 Clearfield
2206 Clemton Park
2800 Clergate
2530 Cleveland
2460 Clifden
2321 Cliftleigh
2515 Clifton
2800 Clifton Grove
2093 Clontarf
2484 Clothiers Creek
2453 Clouds Creek
2480 Clovass
2031 Clovelly
2031 Clovelly West
2480 Clunes
2440 Clybucca
2142 Clyde
2330 Clydesdale
2283 Coal Point
2508 Coalcliff
2460 Coaldale
2108 Coasters Retreat
2486 Cobaki
2486 Cobaki Lakes
2835 Cobar
2790 Cobar Park
2550 Cobargo
2422 Cobark
2347 Cobbadah
2570 Cobbitty
2844 Cobbora
2732 Cobramunga
2539 Cockwhy
2471 Codrington
2480 Coffee Camp
2450 Coffs Harbour
2450 Coffs Harbour Dc
2450 Coffs Harbour Jetty
2450 Coffs Harbour Plaza
2849 Coggan
2083 Cogra Bay
2537 Coila
2462 Coldstream
2707 Coleambally
2761 Colebee
2515 Coledale
2700 Colinroobie
2626 Colinton
2833 Collarenebri
2097 Collaroy
2097 Collaroy Beach
2097 Collaroy Plateau
2581 Collector
2646 Collendina
2839 Collerina
2827 Collie
2650 Collingullie
2850 Collingwood
2474 Collins Creek
2440 Collombatti
2460 Collum Collum
2343 Colly Blue
2756 Colo
2795 Colo
2756 Colo Heights
2575 Colo Vale
2262 Colongra
2760 Colyton
2440 Comara
2666 Combaning
2829 Combara
2540 Comberton
2330 Combo
2429 Comboyne
2832 Come By Chance
2540 Comerong Island
2484 Commissioners Creek
2226 Como
2820 Comobella
2710 Conargo
2137 Concord
2138 Concord West
2138 Concord West Dc
2200 Condell Park
2877 Condobolin
2484 Condong
2422 Coneac
2447 Congarinni
2447 Congarinni North
2325 Congewai
2537 Congo
2829 Conimbia
2500 Coniston
2539 Conjola
2539 Conjola Park
2221 Connells Point
2145 Constitution Hill
2034 Coogee
2870 Cookamidgera
2650 Cookardinia
2850 Cooks Gap
2300 Cooks Hill
2870 Cooks Myalls
2831 Coolabah
2727 Coolac
2550 Coolagolite
2843 Coolah
2701 Coolamon
2535 Coolangatta
2550 Coolangubra
2402 Coolatai
2611 Cooleman
2729 Cooleys Creek
2478 Coolgardie
2423 Coolongolook
2630 Coolringdon
2632 Coolumbooka
2622 Coolumburra
2630 Cooma
2428 Coomba Bay
2428 Coomba Park
2460 Coombadjha
2470 Coombell
2717 Coomealla
2343 Coomoo Coomoo
2357 Coonabarabran
2829 Coonamble
2726 Cooneys Creek
2469 Coongbar
2441 Cooperabung
2426 Coopernook
2550 Coopers Gully
2479 Coopers Shoot
2424 Cooplacurripa
2479 Coorabell
2265 Cooranbong
2590 Cootamundra
2628 Cootralantra
2850 Cooyal
2251 Copacabana
2852 Cope
2422 Copeland
2360 Copeton
2460 Copmanhurst
2644 Coppabella
2795 Copperhannia
2471 Coraki
2443 Coralville
2450 Coramba
2622 Corang
2440 Corangula
2705 Corbie Hill
2526 Cordeaux
2526 Cordeaux Heights
2710 Coree
2646 Coreen
2456 Corindi Beach
2871 Corinella
2315 Corlette
2480 Corndale
2790 Corney Town
2756 Cornwallis
2700 Corobimilla
2646 Corowa
2325 Corrabare
2518 Corrimal
2518 Corrimal East
2711 Corrong
2633 Corrowong
2546 Corunna
2084 Cottage Point
4375 Cottonvale
2474 Cougal
2630 Countegany
2653 Courabyra
2390 Couradda
2720 Couragago
2571 Couridjah
2460 Coutts Crossing
2795 Cow Flat
2652 Cowabbie
2081 Cowan
2460 Cowper
2794 Cowra
2849 Coxs Creek
2849 Coxs Crown
2483 Crabbes Creek
2627 Crackenback
2632 Craigie
2749 Cranebrook
2259 Crangan Bay
2422 Craven
2422 Craven Plateau
2423 Crawford River
2338 Crawney
2627 Creel Bay
2631 Creewah
2090 Cremorne
2090 Cremorne Junction
2090 Cremorne Point
2440 Crescent Head
2620 Crestwood
2502 Cringila
2430 Croki
2099 Cromer
2230 Cronulla
2400 Crooble
2539 Croobyar
2583 Crooked Corner
2583 Crookwell
2527 Croom
2411 Croppa Creek
2850 Cross Roads
2446 Crosslands
2280 Croudace Bay
2443 Crowdy Bay
2427 Crowdy Head
2065 Crows Nest
2065 Crows Nest Dc
2803 Crowther
2460 Crowther Island
2132 Croydon
2133 Croydon Park
2795 Crudine
2832 Cryon
2484 Crystal Creek
2835 Cubba
2864 Cudal
2850 Cudgegong
2700 Cudgel
2487 Cudgen
2484 Cudgera Creek
2540 Cudmirrah
2540 Culburra Beach
2660 Culcairn
2790 Cullen Bullen
2850 Cullenbone
2372 Cullendore
2581 Cullerin
2645 Cullivel
2469 Culmaran Creek
2478 Cumbalum
2852 Cumbandry
2756 Cumberland Reach
2850 Cumbo
2832 Cumborah
2867 Cumnock
2424 Cundle Flat
2430 Cundletown
2866 Cundumbul
2539 Cunjurong Point
2587 Cunningar
2734 Cunninyeuk
2827 Curban
2096 Curl Curl
2672 Curlew Waters
2381 Curlewis
2648 Curlwaa
2820 Curra Creek
2342 Currabubula
2795 Curragh
2533 Curramore
2567 Currans Hill
2540 Currarong
2580 Currawang
2650 Currawarna
2580 Curraweela
2108 Currawong Beach
2422 Curricabark
2536 Currowan
2388 Cuttabri
2546 Cuttagee
2849 Dabee
2032 Daceyville
2325 Dairy Arm
2474 Dairy Flat
2630 Dairymans Plains
2257 Daleys Point
2628 Dalgety
2546 Dalmeny
2460 Dalmorton
2328 Dalswinton
2581 Dalton
2335 Dalwood
2477 Dalwood
2823 Dandaloo
2357 Dandry
2083 Dangar Island
2350 Dangarsleigh
2630 Dangelong
2530 Dapto
2428 Darawank
2722 Darbalara
2793 Darbys Falls
2717 Dareton
2786 Dargan
2795 Dark Corner
2508 Darkes Forest
2454 Darkwood
2027 Darling Point
2010 Darlinghurst
2008 Darlington
2330 Darlington
2706 Darlington Point
2729 Darlow
2870 Daroobalgie
2336 Dartbrook
2340 Daruka
2085 Davidson
2336 Davis Creek
2251 Davistown
2000 Dawes Point
2646 Daysdale
2761 Dean Park
2443 Deauville
2446 Debenham
2099 Dee Why
2440 Deep Creek
2460 Deep Creek
2469 Deep Creek
2371 Deepwater
2453 Deer Vale
2633 Delegate
2403 Delungra
2565 Denham Court
2536 Denhams Beach
2710 Deniliquin
2710 Deniliquin North
2114 Denistone
2112 Denistone East
2114 Denistone West
2328 Denman
2536 Depot Beach
2877 Derriwong
2537 Deua
2537 Deua River Valley
2550 Devils Hole
2422 Dewitt
2770 Dharruk
2650 Dhulura
2733 Dhuragoon
2430 Diamond Beach
2443 Diamond Head
2370 Diehard
2462 Diggers Camp
2546 Dignams Creek
2460 Dilkoon
2734 Dilpurra
2429 Dingo Forest
2404 Dinoga
2666 Dirnaseer
2456 Dirty Creek
2470 Dobies Bight
2550 Doctor George Mountain
2790 Doctors Gap
2795 Dog Rocks
2229 Dolans Bay
2219 Dolls Point
2429 Dollys Flat
2539 Dolphin Point
2530 Dombarton
2350 Donald Creek
2440 Dondingalong
2447 Donnellyville
2484 Doon Doon
2473 Doonbah
2767 Doonside
2259 Dooralong
2264 Dora Creek
2453 Dorrigo
2453 Dorrigo Mountain
2480 Dorroughby
2028 Double Bay
2470 Doubtful Creek
2569 Douglas Park
2030 Dover Heights
2650 Downside
2262 Doyalson
2262 Doyalson North
2330 Doyles Creek
2446 Doyles River
2469 Drake
2469 Drake Village
2386 Drildool
2820 Dripstone
2047 Drummoyne
2337 Dry Creek
2630 Dry Plain
2830 Dubbo
2830 Dubbo Dc
2830 Dubbo East
2830 Dubbo Grove
2830 Dubbo West
2469 Duck Creek
2321 Duckenfield
2787 Duckmaloi
2290 Dudley
2084 Duffys Forest
2484 Dulguigan
2203 Dulwich Hill
2484 Dum Dum
2350 Dumaresq
2430 Dumaresq Island
2372 Dumaresq Valley
2460 Dumbudgery
2484 Dunbible
2443 Dunbogan
2340 Duncans Creek
2117 Dundas
2117 Dundas Valley
2370 Dundee
2453 Dundurrabin
2844 Dunedoo
2480 Dungarubba
2484 Dungay
2849 Dungeree
2420 Dungog
2340 Dungowan
2795 Dunkeld
2529 Dunmore
2330 Dunolly
2480 Dunoon
2321 Duns Creek
2849 Dunville Loop
2158 Dural
2330 Dural
2158 Dural Dc
2795 Duramana
2487 Duranbah
2344 Duri
2486 Duroby
2622 Durran Durra
2536 Durras North
2259 Durren Durren
2350 Duval
2429 Dyers Crossing
2470 Dyraaba
2330 Dyrring
2558 Eagle Vale
2324 Eagleton
2206 Earlwood
2640 East Albury
2478 East Ballina
2576 East Bowral
2335 East Branxton
2471 East Coraki
2518 East Corrimal
2250 East Gosford
2311 East Gresford
2213 East Hills
2627 East Jindabyne
2576 East Kangaloon
2440 East Kempsey
2071 East Killara
2758 East Kurrajong
2070 East Lindfield
2480 East Lismore
2536 East Lynne
2323 East Maitland
2113 East Ryde
2324 East Seaham
2340 East Tamworth
2650 East Wagga Wagga
2477 East Wardell
2766 Eastern Creek
2036 Eastgardens
2018 Eastlakes
2122 Eastwood
2460 Eatonsville
2756 Ebenezer
2453 Ebor
2311 Eccleston
2333 Edderton
2551 Eden
2474 Eden Creek
2176 Edensor Park
2474 Edenville
2027 Edgecliff
2390 Edgeroi
2285 Edgeworth
2787 Edith
2174 Edmondson Park
2551 Edrom
2824 Eenaweena
2795 Eglinton
2460 Eighteen Mile
2429 Elands
2101 Elanora Heights
2404 Elcombe
2335 Elderslie
2570 Elderslie
2282 Eleebana
2287 Elermore Vale
2011 Elizabeth Bay
2428 Elizabeth Beach
2171 Elizabeth Hills
2325 Ellalong
2460 Elland
2470 Ellangowan
2446 Ellenborough
2648 Ellerslie
2729 Ellerslie
2337 Ellerston
2570 Ellis Lane
2831 Elong Elong
2325 Elrington
2360 Elsmore
2480 Eltham
2105 Elvina Bay
2456 Emerald Beach
2380 Emerald Hill
2770 Emerton
2371 Emmaville
2257 Empire Bay
2478 Empire Vale
2750 Emu Heights
2750 Emu Plains
2800 Emu Swamp
2622 Endrick
2136 Enfield
2133 Enfield South
2233 Engadine
2560 Englorie Park
2042 Enmore
2350 Enmore
2840 Enngonia
2620 Environa
2121 Epping
2264 Eraring
2877 Eremerang
2669 Erigolia
2663 Erin Vale
2250 Erina
2250 Erina Fair
2260 Erina Heights
2115 Ermington
2540 Erowal Bay
2791 Errowanbang
2759 Erskine Park
2043 Erskineville
2850 Erudgere
2558 Eschol Park
2472 Esk
2787 Essington
2650 Estella
2257 Ettalong Beach
2640 Ettamogah
2540 Ettrema
2474 Ettrick
2877 Euabalong
2877 Euabalong West
2650 Euberta
2866 Euchareena
2628 Eucumbene
2806 Eugowra
2390 Eulah Creek
2822 Eumungerie
2650 Eunanoreenya
2441 Eungai Creek
2441 Eungai Rail
2484 Eungella
2480 Eureka
2867 Eurimbla
2545 Eurobodalla
2440 Euroka
2700 Euroley
2663 Eurongilly
2850 Eurunderee
2737 Euston
2473 Evans Head
2795 Evans Plains
2015 Eveleigh
2484 Eviron
2469 Ewingar
2481 Ewingsdale
2579 Exeter
2430 Failford
2165 Fairfield
2165 Fairfield East
2165 Fairfield Heights
2165 Fairfield West
2871 Fairholme
2094 Fairlight
2470 Fairy Hill
2519 Fairy Meadow
2330 Falbrook
2365 Falconer
2540 Falls Creek
2535 Far Meadow
2656 Fargunyah
2320 Farley
2526 Farmborough Heights
2820 Farnham
2484 Farrants Hill
2622 Farringdon
2283 Fassifern
2776 Faulconbridge
2422 Faulkland
2474 Fawcetts Plain
2480 Federal
2283 Fennell Bay
2295 Fern Bay
2330 Fern Gully
2775 Fernances
2325 Fernances Crossing
2444 Fernbank Creek
2453 Fernbrook
2519 Fernhill
2479 Fernleigh
2454 Fernmount
2480 Fernside
2484 Fernvale
2318 Ferodale
2159 Fiddletown
2875 Fifield
2525 Figtree
2474 Findon Creek
2460 Fine Flower
2315 Fingal Bay
2487 Fingal Head
2713 Finley
2429 Firefly
2316 Fishermans Bay
2539 Fishermans Paradise
2441 Fishermans Reach
2421 Fishers Hill
2283 Fishing Point
2799 Fitzgeralds Mount
2795 Fitzgeralds Valley
2577 Fitzroy Falls
2046 Five Dock
2873 Five Ways
2420 Flat Tops
2287 Fletcher
2529 Flinders
2280 Floraville
2444 Flynns Beach
2871 Forbes
2621 Forbes Creek
2446 Forbes River
2422 Forbesdale
2840 Fords Bridge
2330 Fordwich
2157 Forest Glen
2795 Forest Grove
2651 Forest Hill
2372 Forest Land
2037 Forest Lodge
2798 Forest Reefs
2087 Forestville
2260 Forresters Beach
2428 Forster
2428 Forster Shopping Village
2460 Fortis Creek
2795 Fosters Valley
2420 Fosterton
2258 Fountaindale
2716 Four Corners
2800 Four Mile Creek
2880 Fowlers Gap
2534 Foxground
2259 Frazer Park
2446 Frazers Creek
2440 Frederickton
2464 Freeburn Island
2259 Freemans
2756 Freemans Reach
2323 Freemans Waterhole
2795 Freemantle
2655 French Park
2086 Frenchs Forest
2086 Frenchs Forest East
2096 Freshwater
2850 Frog Rock
2586 Frogmore
2550 Frogs Hollow
2630 Frying Pan
2583 Fullerton
2318 Fullerton Cove
2370 Furracabad
2765 Gables
2720 Gadara
2716 Gala Vale
2850 Galambine
2585 Galong
2650 Galore
2159 Galston
2790 Ganbenang
2422 Gangat
2702 Ganmain
2405 Garah
2289 Garden Suburb
2871 Garema
2232 Garie
2797 Garland
2330 Garland Valley
2340 Garoo
2866 Garra
2345 Garthowen
2290 Gateshead
2441 Gearys Flat
2642 Geehi
2650 Gelston Park
2795 Gemalla
2474 Geneva
2365 Georges Creek
2198 Georges Hall
2795 Georges Plains
2298 Georgetown
2480 Georgica
2642 Gerogery
2534 Gerringong
2534 Gerroa
2818 Geurie
2474 Ghinni Ghi
2430 Ghinni Ghinni
2380 Ghoolendaadi
2328 Giants Creek
2469 Gibberagee
2370 Gibraltar Range
2666 Gidginbung
2340 Gidley
2560 Gilead
2360 Gilgai
2827 Gilgandra
2829 Gilgooma
2877 Gilgunnia
2700 Gillenbah
2462 Gilletts Ridge
2321 Gillieston Heights
2795 Gilmandyke
2720 Gilmore
2823 Gin Gin
2404 Gineroi
2849 Ginghi
2787 Gingkin
2480 Girards Hill
2831 Girilambone
2422 Giro
2669 Girral
2449 Girralong
2145 Girraween
2425 Girvan
2111 Gladesville
2440 Gladstone
2795 Glanmire
2037 Glebe
2557 Gledswood Hills
2849 Glen Alice
2631 Glen Allen
2560 Glen Alpine
2846 Glen Davis
2370 Glen Elgin
2630 Glen Fergus
2370 Glen Innes
2321 Glen Martin
2365 Glen Nevis
2320 Glen Oak
2422 Glen Ward
2321 Glen William
2337 Glenbawn
2773 Glenbrook
2365 Glencoe
2285 Glendale
2761 Glendenning
2330 Glendon
2330 Glendon Brook
2810 Glenelg
2642 Glenellen
2167 Glenfield
2650 Glenfield Park
2486 Glengarrie
2156 Glenhaven
2454 Gleniffer
2570 Glenmore
2745 Glenmore Park
2330 Glennies Creek
2261 Glenning Valley
2157 Glenorie
2564 Glenquarie
2576 Glenquarry
2450 Glenreagh
2330 Glenridding
2337 Glenrock
2640 Glenroy
2653 Glenroy
2430 Glenthorne
2460 Glenugie
2768 Glenwood
2250 Glenworth Valley
2756 Glossodia
2422 Gloucester
2422 Gloucester Tops
2232 Goarra
2477 Goat Island
2727 Gobarralong
2650 Gobbagombalin
2720 Gocup
2586 Godfreys Creek
2705 Gogeldrie
2738 Gol Gol
2820 Gollan
2580 Golspie
2839 Gongolgon
2732 Gonn
2629 Gooandra
2720 Goobarragandra
2790 Good Forest
2582 Good Hope
2575 Goodmans Ford
2736 Goodnight
2838 Goodooga
2469 Goodwood Island
2620 Googong
2652 Goolgowi
2379 Goolhi
2852 Goolma
2480 Goolmangar
2805 Gooloogong
2646 Goombargana
2480 Goonellabah
2482 Goonengerry
2830 Goonoo Forest
2340 Goonoo Goonoo
2870 Goonumbla
2330 Goorangoola
2396 Goorianawa
2072 Gordon
2469 Gorge Creek
2795 Gormans Hill
2263 Gorokan
2250 Gosford
2320 Gosforth
2358 Gostwyck
2580 Goulburn
2580 Goulburn North
2330 Gouldsville
2795 Gowan
2357 Gowang
2330 Gowrie
2340 Gowrie
2583 Grabben Gullen
2474 Gradys Creek
2460 Grafton
2403 Gragin
2729 Grahamstown
2360 Graman
2765 Grantham Farm
2445 Grants Beach
2142 Granville
2570 Grasmere
2441 Grassy Head
2850 Grattai
2401 Gravesend
2832 Grawin Opal Fields
2232 Grays Point
2108 Great Mackerel Beach
2460 Great Marlow
2551 Green Cape
2338 Green Creek
2471 Green Forest
2850 Green Gully
2323 Green Hills
2365 Green Hills
2730 Green Hills
2474 Green Pigeon
2251 Green Point
2428 Green Point
2168 Green Valley
2190 Greenacre
2550 Greendale
2745 Greendale
2809 Greenethorpe
2176 Greenfield Park
2250 Greengrove
2440 Greenhill
2230 Greenhills Beach
2330 Greenlands
2631 Greenlands
2620 Greenleigh
2471 Greenridge
2540 Greenwell Point
2065 Greenwich
2580 Greenwich Park
2642 Greg Greg
2650 Gregadoo
2557 Gregory Hills
2549 Greigs Flat
2810 Grenfell
2311 Gresford
2334 Greta
2325 Greta Main
2474 Grevillia
2145 Greystanes
2680 Griffith
2680 Griffith Dc
2680 Griffith East
2666 Grogan
2652 Grong Grong
2753 Grose Vale
2753 Grose Wold
2627 Grosses Plain
2849 Growee
2536 Guerilla Bay
2161 Guildford
2161 Guildford West
2828 Gulargambone
2347 Gulf Creek
2852 Gulgong
2463 Gulmarrad
2360 Gum Flat
2441 Gum Scrub
2840 Gumbalie
2865 Gumble
2652 Gumly Gumly
2447 Gumma
2711 Gunbar
2722 Gundagai
2347 Gundamulda
2620 Gundaroo
2580 Gundary
2840 Gunderbooka
2775 Gunderman
2337 Gundy
2333 Gungal
2829 Gungalman
2380 Gunnedah
2581 Gunning
2876 Gunning Gap
2876 Gunningbland
2632 Gunningrah
2852 Guntawang
2398 Gurley
2787 Gurnang
2460 Gurranang
2581 Gurrundah
2624 Guthega
2798 Guyong
2365 Guyra
2356 Gwabegar
2259 Gwandalan
2500 Gwynneville
2227 Gymea
2227 Gymea Bay
2045 Haberfield
2441 Hacks Ferry
2262 Halekulani
2460 Halfway Creek
2430 Hallidays Point
2259 Halloran
2346 Halls Creek
2340 Hallsville
2311 Halton
2330 Hambledon Hill
2303 Hamilton
2303 Hamilton Dc
2303 Hamilton East
2292 Hamilton North
2303 Hamilton South
2641 Hamilton Valley
2259 Hamlyn Terrace
2170 Hammondville
2440 Hampden Hall
2790 Hampton
2340 Hanging Rock
2420 Hanleys Creek
2443 Hannam Vale
2680 Hanwood
2587 Harden
2257 Hardys Bay
2650 Harefield
2850 Hargraves
2622 Harolds Cross
2390 Harparary
2321 Harpers Hill
2427 Harrington
2567 Harrington Park
2150 Harris Park
2790 Hartley
2790 Hartley Vale
2710 Hartwood
2446 Hartys Plains
2465 Harwood
2761 Hassall Grove
2790 Hassans Walls
2489 Hastings Point
2440 Hat Head
2715 Hatfield
2850 Havilah
2777 Hawkesbury Heights
2324 Hawks Nest
2711 Hay
2711 Hay South
2850 Hayes Gap
2000 Haymarket
2469 Haystack
2481 Hayters Hill
2530 Haywards Bay
2779 Hazelbrook
2787 Hazelgrove
2233 Heathcote
2324 Heatherbrae
2330 Hebden
2770 Hebersham
2168 Heckenberg
2321 Heddon Greta
2460 Heifer Station
2508 Helensburgh
2111 Henley
2658 Henty
2622 Hereford Hall
2831 Hermidale
2790 Hermitage Flat
2453 Hernani
2439 Herons Creek
2322 Hexham
2440 Hickeys Creek
2575 High Range
2775 Higher Macdonald
2289 Highfields
2850 Hill End
2575 Hill Top
2628 Hill Top
2420 Hilldale
2350 Hillgrove
2650 Hillgrove
2290 Hillsborough
2320 Hillsborough
2036 Hillsdale
2675 Hillston
2430 Hillville
2340 Hillvue
2168 Hinchinbrook
2321 Hinton
2540 Hmas Albatross
2060 Hmas Platypus
2027 Hmas Rushcutters
2060 Hmas Waterhen
2030 Hmas Watson
2753 Hobartville
2795 Hobbys Yards
2469 Hogarth Range
2644 Holbrook
2250 Holgate
2446 Hollisdale
2328 Hollydeen
2286 Holmesville
2142 Holroyd
2173 Holsworthy
2631 Holts Flat
2850 Home Rule
2140 Homebush
2140 Homebush South
2140 Homebush West
2474 Homeleigh
2825 Honeybugle
2646 Hopefield
2484 Hopkins Creek
2171 Horningsea Park
2077 Hornsby
2077 Hornsby Heights
2474 Horse Station Creek
2320 Horseshoe Bend
2474 Horseshoe Creek
2256 Horsfield Bay
2530 Horsley
2175 Horsley Park
2621 Hoskinstown
2794 Hovells Creek
2480 Howards Grass
2360 Howell
2330 Howes Valley
2330 Howick
2643 Howlong
2171 Hoxton Park
2652 Humula
2840 Hungerford
2110 Hunters Hill
2330 Hunterview
2446 Huntingdon
2148 Huntingwood
2530 Huntley
2800 Huntley
2111 Huntleys Cove
2111 Huntleys Point
2482 Huonbrook
2193 Hurlstone Park
2220 Hurstville
2220 Hurstville Grove
2220 Hurstville Westfield
2540 Huskisson
2540 Hyams Beach
2454 Hydes Creek
2448 Hyland Park
2446 Hyndmans Creek
2463 Ilarwill
2850 Ilford
2590 Illabo
2540 Illaroo
2234 Illawong
2466 Iluka
2642 Indi
2627 Ingebirah
2627 Ingeegoodbee
2565 Ingleburn
2101 Ingleside
2429 Innes View
2360 Inverell
2422 Invergordon
2350 Invergowrie
2473 Iron Gates
2474 Iron Pot Creek
2347 Ironbark
2630 Ironmungy
2470 Irvington
2835 Irymple
2795 Isabella
2296 Islington
2878 Ivanhoe
2460 Jackadgery
2390 Jacks Creek
2469 Jacksons Flat
2463 Jacky Bulbin Flat
2627 Jacobs River
2642 Jagumba
2642 Jagungal Wilderness
2533 Jamberoo
2463 James Creek
2750 Jamisontown
2226 Jannali
2535 Jaspers Brush
2787 Jaunter
2582 Jeir
2550 Jellat Jellat
2871 Jemalong
2622 Jembaicumbene
4383 Jennings
2790 Jenolan
2350 Jeogla
2630 Jerangle
2536 Jeremadra
2795 Jeremy
2716 Jerilderie
2622 Jerrabattgulla
2619 Jerrabomberra
2533 Jerrara
2582 Jerrawa
2540 Jerrawangala
2580 Jerrong
2330 Jerrys Plains
2431 Jerseyville
2299 Jesmond
2280 Jewells
2397 Jews Lagoon
2232 Jibbon
2480 Jiggi
2259 Jilliby
2628 Jimenbuen
2631 Jincumbilly
2627 Jindabyne
2622 Jinden
2642 Jindera
2642 Jingellic
2622 Jingera
2575 Joadja
2469 Joes Box
2443 Johns River
2445 Jolly Nose
2720 Jones Bridge
2430 Jones Island
2787 Jooriland
2747 Jordan Springs
2795 Judds Creek
2726 Jugiong
2460 Junction Hill
2663 Junee
2666 Junee Reefs
2290 Kahibah
2850 Kains Flat
2454 Kalang
2550 Kalaru
2627 Kalkite
2665 Kamarah
2550 Kameruka
2530 Kanahooka
2787 Kanangra
2848 Kandos
2576 Kangaloon
2460 Kangaroo Creek
2224 Kangaroo Point
2577 Kangaroo Valley
2800 Kangaroobie
2582 Kangiara
2258 Kangy Angy
2790 Kanimbla
2550 Kanoona
2259 Kanwal
2661 Kapooka
2390 Kaputar
2429 Karaak Flat
2620 Karabar
2450 Karangi
2232 Kareela
2250 Kariong
2337 Kars Springs
2324 Karuah
2780 Katoomba
2780 Katoomba Dc
2333 Kayuga
2558 Kearns
2325 Kearsley
2782 Kedumba
2340 Keepit
2404 Keera
2480 Keerrong
2320 Keinbah
2500 Keiraville
2478 Keith Hall
2849 Kelgoola
2350 Kellys Plains
2155 Kellyville
2155 Kellyville Ridge
2795 Kelso
2380 Kelvin
2526 Kembla Grange
2526 Kembla Heights
2178 Kemps Creek
2440 Kempsey
2439 Kendall
2396 Kenebri
2449 Kennaicle Creek
2033 Kensington
2156 Kenthurst
2560 Kentlyn
2354 Kentucky
2354 Kentucky South
2439 Kerewong
2711 Keri Keri
2328 Kerrabee
2835 Kerrigundi
2800 Kerrs Creek
2439 Kew
2469 Keybarbin
2642 Khancoban
2429 Khatambuhl
2422 Kia Ora
2877 Kiacatoo
2551 Kiah
2533 Kiama
2533 Kiama Downs
2533 Kiama Heights
2629 Kiandra
2546 Kianga
2259 Kiar
2830 Kickabil
2484 Kielvale
2594 Kikiamah
2669 Kikoira
2283 Kilaben Bay
2472 Kilgin
2474 Kilgra
2429 Killabakh
2071 Killara
2087 Killarney Heights
2261 Killarney Vale
2429 Killawarra
2257 Killcare
2257 Killcare Heights
2449 Killiekrankie
2720 Killimicat
2278 Killingworth
2795 Killongbutta
2429 Kimbriki
2440 Kinchela
2251 Kincumber
2251 Kincumber South
2446 Kindee
2622 Kindervale
2446 King Creek
2259 Kingfisher Shores
2540 Kinghorne
2487 Kings Forest
2324 Kings Hill
2147 Kings Langley
2148 Kings Park
2360 Kings Plains
2799 Kings Plains
2539 Kings Point
2487 Kingscliff
2580 Kingsdale
2118 Kingsdene
2032 Kingsford
2370 Kingsgate
2208 Kingsgrove
2370 Kingsland
2358 Kingstown
2587 Kingsvale
2208 Kingsway West
2340 Kingswood
2550 Kingswood
2747 Kingswood
2478 Kinvara
2539 Kioloa
2537 Kiora
2441 Kippara
2429 Kippaxs
2469 Kippenduff
2795 Kirkconnell
2570 Kirkham
2232 Kirrawee
2232 Kirrawee Dc
2061 Kirribilli
2325 Kitchener
2430 Kiwarrak
2346 Klori
2577 Knights Hill
2479 Knockrow
2424 Knorrit Flat
2424 Knorrit Forest
2217 Kogarah
2217 Kogarah Bay
2680 Kooba
2370 Kookabookra
2256 Koolewong
2460 Koolkhan
2530 Koonawarra
2480 Koonorigan
2482 Koonyum Range
2304 Kooragang
2430 Koorainghat
2807 Koorawatha
2650 Kooringal
2352 Kootingal
2735 Koraleigh
2476 Koreelah
2450 Korora
2627 Kosciuszko
2627 Kosciuszko National Park
2289 Kotara
2305 Kotara East
2289 Kotara Fair
2289 Kotara South
2787 Kowmung
2429 Krambach
2622 Krawarree
2460 Kremnos
2250 Kulnura
2835 Kulwin
2730 Kunama
2441 Kundabung
2429 Kundibakh
2430 Kundle Kundle
2460 Kungala
2484 Kunghur
2484 Kunghur Creek
2757 Kurmond
2231 Kurnell
2089 Kurraba Point
2758 Kurrajong
2758 Kurrajong Heights
2758 Kurrajong Hills
2327 Kurri Kurri
2715 Kyalite
2460 Kyarran
2631 Kybeyan
2650 Kyeamba
2216 Kyeemagh
2221 Kyle Bay
2484 Kynnumboon
2474 Kyogle
2036 La Perouse
2720 Lacmalac
2581 Lade Vale
2652 Ladysmith
2795 Laffing Waters
2583 Laggan
2480 Lagoon Grass
2325 Laguna
2650 Lake Albert
2580 Lake Bathurst
2675 Lake Brewster
2820 Lake Burrendong
2672 Lake Cargelligo
2445 Lake Cathie
2539 Lake Conjola
2671 Lake Cowal
2581 Lake George
2263 Lake Haven
2502 Lake Heights
2462 Lake Hiawatha
3691 Lake Hume Village
2528 Lake Illawarra
2446 Lake Innes
2259 Lake Munmorah
2539 Lake Tabourie
2680 Lake Wyangan
2282 Lakelands
2195 Lakemba
2195 Lakemba Dc
2572 Lakesland
2443 Lakewood
3644 Lalalty
2147 Lalor Park
2335 Lambs Valley
2370 Lambs Valley
2299 Lambton
2652 Landervale
2066 Lane Cove
2066 Lane Cove North
2066 Lane Cove West
2426 Langley Vale
2460 Lanitza
2644 Lankeys Creek
2163 Lansdowne
2430 Lansdowne
2430 Lansdowne Forest
2166 Lansvale
2773 Lapstone
2622 Larbert
2320 Largs
2480 Larnook
2866 Larras Lee
2775 Laughtondale
2649 Laurel Hill
2443 Laurieton
2462 Lavadia
2060 Lavender Bay
2582 Laverstock
2641 Lavington
2641 Lavington Dc
2460 Lawrence
2783 Lawson
2844 Leadville
2335 Leconfield
2849 Lee Creek
2705 Leeton
2775 Leets Vale
2470 Leeville
2476 Legume
2040 Leichhardt
2330 Lemington
2259 Lemon Tree
2319 Lemon Tree Passage
2171 Len Waters Estate
2322 Lenaghan
2478 Lennox Head
2750 Leonay
2179 Leppington
2581 Lerida
2770 Lethbridge Park
2560 Leumeah
2780 Leura
2460 Levenstrath
2311 Lewinsbrook
2800 Lewis Ponds
2049 Lewisham
2480 Leycester
2138 Liberty Grove
2141 Lidcombe
2141 Lidcombe North
2333 Liddell
2790 Lidsdale
2800 Lidster
2444 Lighthouse Beach
2834 Lightning Ridge
2229 Lilli Pilli
2536 Lilli Pilli
2480 Lillian Rock
2460 Lilydale
2040 Lilyfield
2508 Lilyvale
2352 Limbri
2324 Limeburners Creek
2444 Limeburners Creek
2795 Limekilns
2583 Limerick
2361 Limestone
2484 Limpinwood
2850 Linburn
2778 Linden
2480 Lindendale
2347 Lindesay
2476 Lindesay Creek
2070 Lindfield
2070 Lindfield West
2710 Lindifferon
2066 Linley Point
2460 Lionsville
2250 Lisarow
2480 Lismore
2480 Lismore Dc
2480 Lismore Heights
2372 Liston
2790 Lithgow
2474 Little Back Creek
2036 Little Bay
2644 Little Billabong
2538 Little Forest
2790 Little Hartley
2339 Little Jacks Creek
2259 Little Jilliby
2281 Little Pelican
2360 Little Plain
2720 Little River
2880 Little Topar
2256 Little Wobby
2790 Littleton
2170 Liverpool
2170 Liverpool South
2170 Liverpool Westfield
2795 Llanarth
2747 Llandilo
2365 Llangothlin
2650 Lloyd
2474 Loadstone
2549 Lochiel
2321 Lochinvar
2656 Lockhart
2795 Locksley
2232 Loftus
2480 Loftville
2439 Logans Crossing
2713 Logie Brae
2753 Londonderry
2536 Long Beach
2446 Long Flat
2261 Long Jetty
2360 Long Plain
2629 Long Plain
2330 Long Point
2564 Long Point
2347 Longarm
2540 Longreach
2066 Longueville
2867 Loombah
2340 Loomberah
2898 Lord Howe Island
2632 Lords Hill
2320 Lorn
2439 Lorne
2583 Lost River
2311 Lostock
2469 Louisa Creek
2840 Louth
2320 Louth Park
2325 Lovedale
2105 Lovett Bay
2450 Lowanna
2476 Lower Acacia Creek
2730 Lower Bago
2335 Lower Belford
2580 Lower Boro
2469 Lower Bottle Creek
2440 Lower Creek
2469 Lower Duck Creek
2470 Lower Dyraaba
2800 Lower Lewis Ponds
2775 Lower Macdonald
2250 Lower Mangrove
2446 Lower Pappinbarra
2469 Lower Peacock
2756 Lower Portland
2460 Lower Southgate
2646 Lowesdale
2790 Lowther
2326 Loxford
2234 Lucas Heights
2800 Lucknow
2745 Luddenham
2850 Lue
2210 Lugarno
2170 Lurnea
2321 Luskintyre
2474 Lynchs Creek
2350 Lyndhurst
2797 Lyndhurst
2477 Lynwood
2716 Mabins Well
2560 Macarthur Square
2339 Macdonalds Creek
2447 Macksville
2463 Maclean
2251 Macmasters Beach
2113 Macquarie Centre
2564 Macquarie Fields
2285 Macquarie Hills
2565 Macquarie Links
2831 Macquarie Marshes
2113 Macquarie Park
2577 Macquarie Pass
2508 Maddens Plains
2630 Maffra
2261 Magenta
2829 Magometon
2230 Maianbar
2594 Maimuru
2482 Main Arm
2420 Main Creek
2716 Mairjimmy
2330 Maison Dieu
2320 Maitland
2850 Maitland Bar
2320 Maitland North
2320 Maitland Vale
2622 Majors Creek
2036 Malabar
2460 Malabugilmah
2571 Maldon
2319 Mallabula
2734 Mallan
2469 Mallanganee
2738 Mallee
2400 Mallowa
2536 Maloneys Beach
2536 Malua Bay
2200 Manahan
2622 Manar
2577 Manchester Square
2870 Mandagery
2264 Mandalong
2575 Mandemar
2792 Mandurama
2500 Mangerton
2328 Mangoola
2652 Mangoplah
2250 Mangrove Creek
2250 Mangrove Mountain
2865 Manildra
2346 Manilla
2095 Manly
2095 Manly East
2093 Manly Vale
2259 Mannering Park
2430 Manning Point
2653 Mannus
2333 Manobalai
2582 Manton
2539 Manyana
2653 Maragle
2765 Maraylya
2148 Marayong
2800 March
2582 Marchmont
2259 Mardi
2453 Marengo
2422 Mares Run
2663 Marinna
2280 Marks Point
2423 Markwell
2429 Marlee
2232 Marley
2441 Marlo Merrican
2775 Marlow
2622 Marlowe
2284 Marmong Point
2480 Marom Creek
2756 Maroota
2035 Maroubra
2035 Maroubra South
2790 Marrangaroo
2652 Marrar
2204 Marrickville
2204 Marrickville Metro
2204 Marrickville South
2765 Marsden Park
2122 Marsfield
2530 Marshall Mount
2420 Marshdale
2824 Marthaguy
2328 Martindale
2420 Martins Creek
2265 Martinsville
2579 Marulan
2287 Maryland
4377 Maryland
2380 Marys Mount
2820 Maryvale
2293 Maryville
2020 Mascot
2250 Matcham
2370 Matheson
2710 Mathoura
2652 Matong
2036 Matraville
2711 Maude
2382 Maules Creek
2650 Maxwell
2365 Maybole
2423 Mayers Flat
2304 Mayfield
2540 Mayfield
2580 Mayfield
2787 Mayfield
2304 Mayfield East
2304 Mayfield North
2304 Mayfield West
2710 Mayrung
2145 Mays Hill
2347 Mayvale
2105 McCarrs Creek
2333 McCullys Gap
2330 McDougalls Hill
2756 McGraths Hill
2480 McKees Hill
2790 McKellars Park
2480 McLeans Ridges
2479 McLeods Shoot
2060 McMahons Point
2587 McMahons Reef
2795 Meadow Flat
2114 Meadowbank
2484 Mebbin
2852 Mebul
2780 Medlow Bath
2318 Medowie
2577 Medway
2477 Meerschaum Vale
2785 Megalong Valley
2453 Megan
2669 Melbergen
2430 Melinga
2756 Mellong
2734 Mellool
2765 Melonba
2114 Melrose Park
2320 Melville
2594 Memagong
2850 Menah
2234 Menai
2234 Menai Central
2568 Menangle
2563 Menangle Park
2842 Mendooran
2879 Menindee
2388 Merah North
2291 Merewether
2291 Merewether Heights
2548 Merimbula
2537 Meringo
2422 Mernot
2850 Meroo
2540 Meroo Meadow
2852 Merotherie
2632 Merriangaah
2622 Merricumbene
2827 Merrigal
2581 Merrill
2329 Merriwa
2652 Merriwagga
2831 Merrygoen
2160 Merrylands
2160 Merrylands West
2705 Merungle Hill
2577 Meryla
2323 Metford
2323 Metford Dc
2701 Methul
2350 Metz
2873 Miamley
2825 Miandetta
2464 Micalo Island
2620 Michelago
2580 Middle Arm
2337 Middle Brook
2443 Middle Brother
2068 Middle Cove
2158 Middle Dural
2330 Middle Falbrook
2630 Middle Flat
2483 Middle Pocket
2171 Middleton Grange
2630 Middlingbank
2484 Midginbil
2358 Mihi
2632 Mila
2330 Milbrodale
2656 Milbrulong
2795 Milkers Flat
2795 Millah Murrah
2440 Millbank
2168 Miller
2324 Millers Forest
2000 Millers Point
2325 Millfield
2397 Millie
2549 Millingandi
2798 Millthorpe
2880 Milparinka
2214 Milperra
2380 Milroy
2850 Milroy
2083 Milsons Passage
2061 Milsons Point
2538 Milton
2594 Milvale
2666 Mimosa
2770 Minchinbury
2320 Mindaribba
2372 Mingoola
2312 Minimbah
2720 Minjary
2287 Minmi
2533 Minnamurra
2462 Minnie Water
2830 Minore
2566 Minto
2566 Minto Heights
2548 Mirador
2228 Miranda
2330 Mirannie
2264 Mirrabooka
2665 Mirrool
2449 Missabotti
2050 Missenden Road
2795 Mitchell
2330 Mitchells Flat
2430 Mitchells Island
2575 Mittagong
2731 Moama
2480 Modanville
2550 Mogareeka
2537 Mogendoura
2370 Moggs Swamp
2550 Mogilla
2536 Mogo
2850 Mogo
2775 Mogo Creek
2538 Mogood
2422 Mograni
2830 Mogriguy
2372 Mole River
2460 Moleville Creek
2842 Mollyan
2539 Mollymook
2539 Mollymook Beach
2866 Molong
2103 Mona Vale
2738 Monak
2480 Monaltrie
2111 Monash Park
2540 Mondayong
2430 Mondrook
2622 Monga
2622 Mongarlowe
2470 Mongogarie
2675 Monia Gap
2850 Monivae
2415 Monkerai
2594 Monteagle
2482 Montecollum
2820 Montefiores
2217 Monterey
2483 Mooball
2337 Moobi
2370 Moogem
2820 Mookerawa
2469 Mookima Wybra
2850 Moolarben
2540 Moollattoo
2734 Moolpa
2665 Moombooldool
2337 Moonan Brook
2337 Moonan Flat
2627 Moonbah
2353 Moonbi
2710 Moonbria
2440 Mooneba
2259 Moonee
2450 Moonee Beach
2472 Moonem
2083 Mooney Mooney
2250 Mooney Mooney Creek
2453 Moonpar
2429 Mooral Creek
2648 Moorara
2804 Moorbel
2340 Moore Creek
2021 Moore Park
2170 Moorebank
2795 Moorilda
2443 Moorland
2650 Moorong
2640 Moorwatha
2440 Moparrabah
2422 Moppy
2710 Morago
2666 Morangarell
2550 Morans Crossing
2400 Moree
2264 Morisset
2264 Morisset Park
2105 Morning Bay
2469 Mororo
2321 Morpeth
2223 Mortdale
2137 Mortlake
2538 Morton
2446 Mortons Creek
2790 Morts Estate
2325 Moruben
2700 Morundah
2537 Moruya
2537 Moruya Heads
2370 Morven
2660 Morven
2088 Mosman
2577 Moss Vale
2878 Mossgiel
2537 Mossy Point
2426 Moto
2733 Moulamein
2729 Mount Adrah
2567 Mount Annan
2820 Mount Aquila
2820 Mount Arthur
2650 Mount Austin
2484 Mount Burrell
2079 Mount Colah
2794 Mount Collins
2631 Mount Cooper
2632 Mount Darragh
2795 Mount David
2320 Mount Dee
2770 Mount Druitt
2770 Mount Druitt Village
2250 Mount Elliot
2580 Mount Fairy
2824 Mount Foster
2850 Mount Frome
2424 Mount George
2824 Mount Harris
2877 Mount Hope
2729 Mount Horeb
2570 Mount Hunter
2290 Mount Hutton
2786 Mount Irvine
2500 Mount Keira
2526 Mount Kembla
2539 Mount Kingiman
2850 Mount Knowles
2080 Mount Kuring-Gai
2790 Mount Lambie
2190 Mount Lewis
2200 Mount Lewis
2575 Mount Lindsey
2849 Mount Marsden
2469 Mount Marsh
2365 Mount Mitchell
2577 Mount Murray
2330 Mount Olive
2787 Mount Olive
2519 Mount Ousley
2795 Mount Panorama
2519 Mount Pleasant
2170 Mount Pritchard
2795 Mount Rankin
2311 Mount Rivers
2774 Mount Riverview
2330 Mount Royal
2360 Mount Russell
2500 Mount Saint Thomas
2446 Mount Seaview
2828 Mount Tenandra
2330 Mount Thorley
2758 Mount Tomah
2178 Mount Vernon
2786 Mount Victoria
2325 Mount View
2323 Mount Vincent
2484 Mount Warning
2528 Mount Warrigal
2787 Mount Werong
2250 Mount White
2786 Mount Wilson
2644 Mountain Creek
2758 Mountain Lagoon
2480 Mountain Top
2460 Mountain View
2739 Mourquong
2571 Mowbray Park
2787 Mozart
2850 Mudgee
2323 Mulbring
2745 Mulgoa
2756 Mulgrave
2877 Mulguthrie
2476 Muli Muli
2825 Mulla
2352 Mulla Creek
2379 Mullaley
2850 Mullamuddy
2456 Mullaway
2644 Mullengandra
2825 Mullengudgery
2582 Mullion
2800 Mullion Creek
2622 Mulloon
2482 Mullumbimby
2482 Mullumbimby Creek
2647 Mulwala
2871 Mulyandry
2820 Mumbil
2824 Mumblebone Plain
2550 Mumbulla Mountain
2580 Mummel
2469 Mummulgum
2540 Mundamia
2729 Mundarlo
2653 Munderoo
2720 Mundongo
2440 Mungay Creek
2850 Munghorn
2406 Mungindi
2715 Mungo
2423 Mungo Brush
2420 Munni
2658 Munyabla
2624 Munyang
2864 Murga
2546 Murrah
2705 Murrami
2825 Murrawombie
2734 Murray Downs
2642 Murray Gorge
2281 Murrays Beach
2325 Murrays Run
2622 Murrengenburg
2672 Murrin Bridge
2586 Murringo
2652 Murrulebale
2582 Murrumbateman
2849 Murrumbo
2630 Murrumbucca
2587 Murrumburrah
2338 Murrurundi
2337 Murulla
2484 Murwillumbah
2484 Murwillumbah Dc
2484 Murwillumbah South
2333 Muscle Creek
2333 Muswellbrook
2880 Mutawintji
2722 Muttama
2403 Myall Creek
2423 Myall Lake
2681 Myall Park
2630 Myalla
2454 Mylestom
2460 Mylneford
2481 Myocum
2540 Myola
2469 Myrtle Creek
2550 Myrtle Mountain
2713 Myrtle Park
2580 Myrtleville
2546 Mystery Bay
2264 Myuna Bay
2312 Nabiac
2551 Nadgee
2448 Nambucca Heads
2346 Namoi River
2450 Nana Glen
2722 Nangus
2582 Nanima
2379 Napier Lane
2795 Napoleon Reef
2669 Naradhan
2250 Narara
2567 Narellan
2567 Narellan Vale
2065 Naremburn
2325 Narone Creek
2546 Narooma
2551 Narrabarba
2101 Narrabeen
2390 Narrabri
2390 Narrabri West
2666 Narraburra
2839 Narran Lake
2700 Narrandera
2582 Narrangullen
2583 Narrawa
2539 Narrawallee
2099 Narraweena
2821 Narromine
2209 Narwee
2800 Nashdale
2479 Nashua
2570 Nattai
2470 Naughtons Gap
2326 Neath
2829 Nebea
2831 Neilrex
2536 Nelligen
2550 Nelson
2765 Nelson
2315 Nelson Bay
2324 Nelsons Plains
2876 Nelungaloo
2340 Nemingha
2680 Nericon
2622 Neringla
2423 Nerong
2622 Nerriga
2545 Nerrigundah
2549 Nethercote
2820 Neurea
2089 Neutral Bay
2089 Neutral Bay Junction
2453 Never Never
2826 Nevertire
2799 Neville
2577 New Berrima
2483 New Brighton
2550 New Buildings
2472 New Italy
2305 New Lambton
2305 New Lambton Heights
2346 New Mexico
2474 New Park
2365 New Valley
2460 Newbold
2795 Newbridge
2300 Newcastle
2300 Newcastle East
2308 Newcastle University
2302 Newcastle West
2447 Newee Creek
2127 Newington
2790 Newnes
2790 Newnes Plateau
2106 Newport
2106 Newport Beach
2479 Newrybar
2360 Newstead
2370 Newton Boyd
2042 Newtown
2627 Ngarigo
2250 Niagara Park
2354 Niangala
2733 Niemur
2480 Nightcap
2480 Nimbin
2631 Nimmitabel
2628 Nimmo
2763 Nirimba Fields
2484 Nobbys Creek
2379 Nombi
2835 Noona
2732 Noorong
2415 Nooroo
2263 Norah Head
2263 Noraville
2281 Nords Wharf
2899 Norfolk Island
2076 Normanhurst
2640 North Albury
2484 North Arm
2324 North Arm Cove
2260 North Avoca
2093 North Balgowlah
2536 North Batemans Bay
2450 North Boambee Valley
2026 North Bondi
2840 North Bourke
2443 North Brother
2470 North Casino
2099 North Curl Curl
2453 North Dorrigo
2121 North Epping
2250 North Gosford
2443 North Haven
2155 North Kellyville
2299 North Lambton
2480 North Lismore
2447 North Macksville
2100 North Manly
2546 North Narooma
2101 North Narrabeen
2541 North Nowra
2151 North Parramatta
2754 North Richmond
2151 North Rocks
2335 North Rothbury
2113 North Ryde
2444 North Shore
2760 North St Marys
2408 North Star
2137 North Strathfield
2060 North Sydney
2060 North Sydney Shoppingworld
2340 North Tamworth
2490 North Tumbulgum
2074 North Turramurra
2650 North Wagga Wagga
2076 North Wahroonga
2068 North Willoughby
2500 North Wollongong
2471 North Woodburn
2671 North Yalgogrin
2868 North Yeoval
2622 Northangera
2063 Northbridge
2152 Northmead
2066 Northwood
2787 Norway
2153 Norwest
2354 Nowendoc
2386 Nowley
2541 Nowra
2541 Nowra Dc
2541 Nowra East
2540 Nowra Hill
2540 Nowra Naval Po
2587 Nubba
2325 Nulkaba
2360 Nullamanna
2551 Nullica
2849 Nullo Mountain
2540 Numbaa
2424 Number One
2628 Numbla Vale
2550 Numbugga
2630 Numeralla
2484 Numinbah
2480 Numulgi
2484 Nunderi
2340 Nundle
2629 Nungar
2551 Nungatta
2551 Nungatta South
2649 Nurenmerenmong
2831 Nymagee
2460 Nymboida
2825 Nyngan
2646 Nyora
2804 Nyrang Creek
2529 Oak Flats
2570 Oakdale
2790 Oakey Park
2320 Oakhampton
2320 Oakhampton Heights
2761 Oakhurst
2646 Oaklands
2765 Oakville
2360 Oakwood
2622 Oallen
2117 Oatlands
2223 Oatley
2365 Oban
2330 Obanvale
2650 Oberne Creek
2787 Oberon
2868 Obley
2483 Ocean Shores
2340 Ogunbil
2629 Old Adaminaby
2430 Old Bar
2469 Old Bonalbo
2540 Old Erowal Bay
2474 Old Grevillia
2161 Old Guildford
2652 Old Junee
2369 Old Mill
2440 Old Station
2146 Old Toongabbie
2849 Olinda
2325 Olney
2337 Omadale
2316 One Mile
2711 One Tree
2581 Oolong
2871 Ooma
2875 Ootha
2800 Ophir
2570 Oran Park
2800 Orange
2800 Orange Dc
2800 Orange East
2380 Orange Grove
2800 Orange Moulder Street
2570 Orangeville
2748 Orchard Hills
2540 Orient Point
2795 Orton Park
2656 Osborne
2324 Osterley
2321 Oswald
2508 Otford
2650 Oura
2258 Ourimbah
2640 Ournie
2337 Owens Gap
2100 Oxford Falls
2711 Oxley
2824 Oxley
2430 Oxley Island
2760 Oxley Park
2340 Oxley Vale
2225 Oyster Bay
2318 Oyster Cove
2428 Pacific Palms
2880 Packsaddle
2021 Paddington
2469 Paddys Flat
2632 Paddys Flat
2577 Paddys River
2653 Paddys River
2211 Padstow
2211 Padstow Heights
2469 Pagans Flat
2337 Pages Creek
2338 Pages River
2035 Pagewood
2632 Palarang
2622 Palerang
2580 Paling Yards
2795 Paling Yards
2404 Pallal
2399 Pallamallawa
2108 Palm Beach
2258 Palm Grove
2258 Palmdale
2463 Palmers Channel
2463 Palmers Island
2795 Palmers Oaky
2484 Palmvale
2482 Palmwoods
2232 Palona
2549 Pambula
2549 Pambula Beach
2430 Pampoolah
2648 Pan Ban
2213 Panania
2825 Pangee
2800 Panuara
2446 Pappinbarra
2648 Para
2360 Paradise
2738 Paringi
2870 Parkes
2580 Parkesbourne
2768 Parklea
2337 Parkville
2000 Parliament House
2540 Parma
2150 Parramatta
2150 Parramatta Westfield
2339 Parraweena
2478 Patchs Beach
2421 Paterson
2256 Patonga
2628 Paupong
2325 Paxton
2325 Paynes Crossing
2871 Paytens Bridge
2469 Peacock Creek
2869 Peak Hill
2630 Peak View
2210 Peakhurst
2210 Peakhurst Dc
2210 Peakhurst Heights
2477 Pearces Creek
2256 Pearl Beach
2250 Peats Ridge
2536 Pebbly Beach
2795 Peel
2583 Peelwood
2583 Pejar
2327 Pelaw Main
2281 Pelican
2325 Pelton
2446 Pembrooke
2145 Pemulwuy
2145 Pendle Hill
2120 Pennant Hills
2750 Penrith
2750 Penrith Plaza
2750 Penrith South
2579 Penrose
2222 Penshurst
2550 Pericoe
2624 Perisher Valley
2775 Perrys Crossing
2795 Perthville
2049 Petersham
2574 Pheasants Nest
2256 Phegans Bay
2036 Phillip Bay
2321 Phoenix Park
2340 Piallamore
2342 Piallaway
2850 Piambong
2251 Picketts Valley
2213 Picnic Point
2571 Picton
2824 Pigeonbah
2486 Piggabeen
2469 Pikapene
2462 Pillar Valley
2388 Pilliga
2627 Pilot Wilderness
2478 Pimlico
2478 Pimlico Island
2720 Pinbeyan
2361 Pindaroi
2324 Pindimar
2648 Pine Camp
2824 Pine Clump
2829 Pine Grove
2714 Pine Lodge
2343 Pine Ridge
2630 Pine Valley
2810 Piney Range
2370 Pinkett
2810 Pinnacle
2849 Pinnacle Swamp
2281 Pinny Beach
2470 Piora
2446 Pipeclay
2323 Pitnacree
2756 Pitt Town
2756 Pitt Town Bottoms
2658 Pleasant Hills
2172 Pleasure Point
2761 Plumpton
2250 Point Clare
2250 Point Frederick
2027 Point Piper
2259 Point Wolstoncroft
2539 Pointer Mountain
2320 Pokolbin
2440 Pola Creek
2630 Polo Flat
2580 Pomeroy
2648 Pomona
2818 Ponto
2648 Pooncarie
2036 Port Botany
2229 Port Hacking
2505 Port Kembla
2444 Port Macquarie
2444 Port Macquarie Bc
2538 Porters Creek
2787 Porters Retreat
2847 Portland
2430 Possum Brush
2479 Possum Creek
2545 Potato Point
2790 Pottery Estate
2143 Potts Hill
2011 Potts Point
2489 Pottsville
2489 Pottsville Beach
2176 Prairiewood
2381 Premer
2170 Prestons
2257 Pretty Beach
2539 Pretty Beach
2710 Pretty Pine
2502 Primbee
2621 Primrose Valley
2148 Prospect
2629 Providence Portal
2666 Pucawan
2350 Puddledock
2460 Pulganbar
2810 Pullabooka
2650 Pulletop
2484 Pumpenbil
2196 Punchbowl
2460 Punchbowl
2430 Purfleet
2357 Purlewaugh
2112 Putney
2850 Putta Bucca
2330 Putty
2849 Pyangle
2073 Pymble
2850 Pyramul
2540 Pyree
2009 Pyrmont
2550 Quaama
2763 Quakers Hill
2831 Quambone
2828 Quanda
2665 Quandary
2721 Quandialla
2620 Queanbeyan
2620 Queanbeyan Dc
2620 Queanbeyan East
2620 Queanbeyan West
2022 Queens Park
2850 Queens Pinch
2096 Queenscliff
2580 Quialigo
2632 Quidong
2622 Quiera
2343 Quipolly
2343 Quirindi
2325 Quorrobolong
2566 Raby
2795 Raglan
2430 Rainbow Flat
2440 Rainbow Reach
2454 Raleigh
2460 Ramornie
2217 Ramsgate
2217 Ramsgate Beach
2642 Rand
2031 Randwick
2031 Randwick Dc
2380 Rangari
2370 Rangers Valley
2287 Rankin Park
2669 Rankins Springs
2701 Rannock
2469 Rappville
2283 Rathmines
2259 Ravensdale
2824 Ravenswood
2330 Ravensworth
2446 Rawdon Island
2422 Rawdon Vale
2321 Raworth
2830 Rawsonville
2324 Raymond Terrace
2324 Raymond Terrace East
2571 Razorback
2430 Red Head
2347 Red Hill
2720 Red Hill
2824 Red Hill
2370 Red Range
2456 Red Rock
2577 Red Rocks
2446 Redbank
2330 Redbournberry
2370 Reddestone
2016 Redfern
2290 Redhead
2646 Redlands
2330 Reedy Creek
2550 Reedy Swamp
2666 Reefton
2143 Regents Park
2745 Regentville
2586 Reids Flat
2622 Reidsdale
2646 Rennie
2722 Reno
2575 Renwick
2480 Repentance Creek
2454 Repton
2484 Reserve Creek
2355 Retreat
2212 Revesby
2212 Revesby Heights
2212 Revesby North
2630 Rhine Falls
2138 Rhodes
2765 Richards
2580 Richlands
2753 Richmond
2480 Richmond Hill
2753 Richmond Lowlands
2323 Richmond Vale
2472 Rileys Hill
2646 Ringwood
2678 Riverina Mc
2850 Riverlea
2444 Riverside
2765 Riverstone
2372 Rivertree
2066 Riverview
2210 Riverwood
2330 Rixs Creek
2360 Rob Roy
2577 Robertson
2795 Robin Hill
2630 Rock Flat
2795 Rock Forest
2480 Rock Valley
2216 Rockdale
2216 Rockdale Dc
2795 Rockley
2795 Rockley Mount
2632 Rockton
2371 Rocky Creek
2390 Rocky Creek
2357 Rocky Glen
2550 Rocky Hall
2628 Rocky Plain
2259 Rocky Point
2358 Rocky River
2372 Rocky River
2046 Rodd Point
2441 Rollands Plains
2422 Rookhurst
2141 Rookwood
2766 Rooty Hill
2395 Ropers Road
2760 Ropes Crossing
2029 Rose Bay
2030 Rose Bay North
2534 Rose Valley
2630 Rose Valley
2480 Rosebank
2793 Roseberg
2474 Roseberry
2474 Roseberry Creek
2018 Rosebery
2320 Rosebrook
2536 Rosedale
2142 Rosehill
2196 Roselands
2560 Rosemeadow
2632 Rosemeath
2069 Roseville
2069 Roseville Chase
2446 Rosewood
2652 Rosewood
2580 Roslyn
2439 Rossglen
2336 Rossgole
2621 Rossi
2557 Rossmore
2320 Rothbury
2675 Roto
2336 Rouchel
2336 Rouchel Brook
2330 Roughit
2158 Round Corner
2484 Round Mountain
2846 Round Swamp
2477 Rous
2477 Rous Mill
2155 Rouse Hill
2650 Rowan
2387 Rowena
2484 Rowlands Creek
2065 Royal North Shore Hospital
2620 Royalla
2039 Rozelle
4380 Ruby Creek
2648 Rufus
2583 Rugby
2474 Rukenvale
2580 Run-O-Waters
2850 Running Stream
2536 Runnyford
2560 Ruse
2011 Rushcutters Bay
2346 Rushes Creek
2460 Rushforth
2046 Russell Lea
2517 Russell Vale
2320 Rutherford
2480 Ruthven
2658 Ryan
2790 Rydal
2116 Rydalmere
2112 Ryde
2586 Rye Park
2283 Ryhope
2849 Rylstone
2756 Sackville
2756 Sackville North
2533 Saddleback Mountain
2168 Sadleir
2456 Safety Beach
2317 Salamander Bay
2420 Salisbury
2358 Salisbury Plains
2850 Sallys Flat
2318 Salt Ash
2430 Saltwater
2650 San Isidore
2262 San Remo
2446 Sancrox
2540 Sanctuary Point
2428 Sandbar
2304 Sandgate
2700 Sandigo
2469 Sandilands
2463 Sandon
2219 Sandringham
2456 Sandy Beach
2338 Sandy Creek
2835 Sandy Creek
2460 Sandy Crossing
2372 Sandy Flat
2729 Sandy Gully
2372 Sandy Hill
2333 Sandy Hollow
2172 Sandy Point
2646 Sanger
2219 Sans Souci
2360 Sapphire
2450 Sapphire Beach
2251 Saratoga
2622 Sassafras
2350 Saumarez
2350 Saumarez Ponds
2646 Savernake
2474 Sawpit Creek
2452 Sawtell
2326 Sawyers Gully
2515 Scarborough
2756 Scheyville
2762 Schofields
2337 Scone
2648 Scotia
2105 Scotland Island
2338 Scotts Creek
2330 Scotts Flat
2447 Scotts Head
2092 Seaforth
2324 Seaham
2286 Seahampton
2423 Seal Rocks
2666 Sebastopol
2330 Sedgefield
2460 Seelands
2162 Sefton
2337 Segenhoe
2444 Settlement City
2147 Seven Hills
2147 Seven Hills West
2440 Seven Oaks
2470 Sextonville
2800 Shadforth
2428 Shallow Bay
2770 Shalvey
2747 Shane Park
2747 Shanes Park
2470 Shannon Brook
2370 Shannon Vale
2460 Shannondale
2630 Shannons Flat
2463 Shark Creek
2729 Sharps Creek
2790 Sheedys Gully
2529 Shell Cove
2529 Shellharbour
2529 Shellharbour City Centre
2261 Shelly Beach
2440 Sherwood
2450 Sherwood
2474 Sherwood
2315 Shoal Bay
2535 Shoalhaven Heads
2787 Shooters Hill
2307 Shortland
2372 Silent Grove
2752 Silverdale
2880 Silverton
2128 Silverwater
2264 Silverwater
2469 Simpkins Creek
2330 Singleton
2330 Singleton Dc
2330 Singleton Heights
2775 Singletons Mill
2469 Six Mile Swamp
2478 Skennars Head
2440 Skillion Flat
2481 Skinners Shoot
2483 Sleepy Hollow
2567 Smeaton Grange
2624 Smiggin Holes
2164 Smithfield
2164 Smithfield West
2460 Smiths Creek
2474 Smiths Creek
2484 Smiths Creek
2428 Smiths Lake
2440 Smithtown
2824 Snakes Plain
2622 Snowball
2628 Snowy Plain
2790 Sodwalls
2795 Sofala
2317 Soldiers Point
2250 Somersby
2340 Somerton
2640 South Albury
2449 South Arm
2460 South Arm
2478 South Ballina
2795 South Bathurst
2790 South Bowenfels
2880 South Broken Hill
2034 South Coogee
2536 South Durras
2473 South Evans Head
2483 South Golden Beach
2460 South Grafton
2142 South Granville
2722 South Gundagai
2480 South Gundurimba
2365 South Guyra
2221 South Hurstville
2440 South Kempsey
2480 South Lismore
2790 South Littleton
2320 South Maitland
2756 South Maroota
2484 South Murwillumbah
2541 South Nowra
2549 South Pambula
2750 South Penrith
2340 South Tamworth
2074 South Turramurra
2145 South Wentworthville
2431 South West Rocks
2756 South Windsor
2550 South Wolumla
2460 Southampton
2460 Southgate
2284 Speers Point
2735 Speewa
2775 Spencer
2820 Spicers Creek
2454 Spicketts Creek
2088 Spit Junction
2640 Splitters Creek
2800 Spring Creek
2570 Spring Farm
2850 Spring Flat
2470 Spring Grove
2500 Spring Hill
2800 Spring Hill
2370 Spring Mountain
2388 Spring Plains
2343 Spring Ridge
2798 Spring Terrace
2666 Springdale
2641 Springdale Heights
2250 Springfield
2630 Springfield
2618 Springrange
2800 Springside
2650 Springvale
2777 Springwood
2775 St Albans
2566 St Andrews
2330 St Clair
2759 St Clair
2850 St Fillans
2622 St George
2540 St Georges Basin
2560 St Helens Park
2257 St Huberts Island
2075 St Ives
2075 St Ives Chase
2176 St Johns Park
2065 St Leonards
2760 St Marys
2760 St Marys East
2760 St Marys South
2031 St Pauls
2044 St Peters
2360 Stanborough
2705 Stanbridge
2327 Stanford Merthyr
2335 Stanhope
2768 Stanhope Gardens
2048 Stanmore
2369 Stannifer
2371 Stannum
2508 Stanwell Park
2508 Stanwell Tops
2790 State Mine Gully
2710 Steam Plains
2631 Steeple Flat
2337 Stewarts Brook
2795 Stewarts Mount
2443 Stewarts River
2725 Stockinbingal
2322 Stockrington
2295 Stockton
2460 Stockyard Creek
2484 Stokers Siding
2370 Stonehenge
2580 Stonequarry
2480 Stony Chute
2550 Stony Creek
2850 Stony Creek
2734 Stony Crossing
2487 Stotts Creek
2422 Stratford
2429 Strathcedar
2470 Stratheden
2135 Strathfield
2136 Strathfield South
2526 Stream Hill
2425 Stroud
2420 Stroud Hill
2415 Stroud Road
2820 Stuart Town
2441 Stuarts Point
2852 Stubbo
2710 Stud Park
2481 Suffolk Park
2420 Sugarloaf
2130 Summer Hill
2421 Summer Hill
2800 Summer Hill Creek
2440 Summer Island
2259 Summerland Point
2777 Sun Valley
2795 Sunny Corner
2879 Sunset Strip
2264 Sunshine
2536 Sunshine Bay
2820 Suntop
2536 Surf Beach
2536 Surfside
2010 Surry Hills
2540 Sussex Inlet
2232 Sutherland
2620 Sutton
2577 Sutton Forest
2324 Swan Bay
2471 Swan Bay
2462 Swan Creek
2370 Swan Vale
2360 Swanbrook
2540 Swanhaven
2439 Swans Crossing
2281 Swansea
2281 Swansea Heads
2325 Sweetmans Creek
2044 Sydenham
2000 Sydney
2020 Sydney Domestic Airport
2020 Sydney International Airport
2127 Sydney Olympic Park
2000 Sydney South
2224 Sylvania
2224 Sylvania Southgate
2224 Sylvania Waters
2420 Tabbil Creek
2472 Tabbimoble
2652 Tabbita
2640 Table Top
2469 Tabulam
2259 Tacoma
2259 Tacoma South
2324 Tahlee
2573 Tahmoor
2447 Talarm
2839 Talawanta
2720 Talbingo
2852 Tallawang
2762 Tallawong
2669 Tallimba
2579 Tallong
2540 Tallowal
2453 Tallowwood Ridge
2798 Tallwood
2430 Tallwoods Village
2640 Talmalmo
2481 Talofa
2463 Taloumbi
2026 Tamarama
2441 Tamban
2381 Tambar Springs
2850 Tambaroora
2340 Taminda
2340 Tamworth
2488 Tanglewood
2319 Tanilba Bay
2550 Tanja
2795 Tannas Mount
2629 Tantangara
2550 Tantawangalo
2731 Tantonan
2540 Tapitallee
2665 Tara
2653 Taradale
2580 Tarago
2580 Taralga
2787 Tarana
2372 Tarban
2428 Tarbuck Bay
2652 Tarcutta
2430 Taree
2430 Taree Dc
2430 Taree South
2229 Taren Point
2580 Tarlo
2550 Tarraganda
2518 Tarrawanna
2390 Tarriaro
2322 Tarro
2250 Tascott
2471 Tatham
2550 Tathra
2650 Tatton
2447 Taylors Arm
2316 Taylors Beach
2586 Taylors Flat
2324 Tea Gardens
2320 Telarah
2441 Telegraph Point
2117 Telopea
2440 Temagog
2666 Temora
2044 Tempe
2250 Ten Mile Hollow
2323 Tenambit
2824 Tenandra
2754 Tennyson
2111 Tennyson Point
2365 Tenterden
2372 Tenterfield
2284 Teralba
2480 Terania Creek
2540 Terara
2829 Teridgerie
2539 Termeil
2818 Terrabella
2474 Terrace Creek
2484 Terragon
2830 Terramungamine
2486 Terranora
2422 Terreel
2084 Terrey Hills
2260 Terrigal
2400 Terry Hie Hie
2478 Teven
2449 Tewinga
4385 Texas
2350 Thalgarrah
2680 Tharbogang
2620 The Angle
2365 The Basin
2429 The Bight
2425 The Branch
2630 The Brothers
2480 The Channon
2758 The Devils Wilderness
2261 The Entrance
2261 The Entrance North
2466 The Freshwater
2472 The Gap
2650 The Gap
2476 The Glen
2365 The Gulf
2444 The Hatch
2300 The Hill
2291 The Junction
2795 The Lagoon
2831 The Marra
2787 The Meadows
2570 The Oaks
2388 The Pilliga
2460 The Pinnacles
2483 The Pocket
2769 The Ponds
2620 The Ridgeway
2474 The Risk
2655 The Rock
2000 The Rocks
2795 The Rocks
2463 The Sandon
2754 The Slopes
2460 The Whiteman
2469 Theresa Creek
2570 Theresa Park
2347 Thirldene
2572 Thirlmere
2515 Thirroul
2454 Thora
2120 Thornleigh
2322 Thornton
2625 Thredbo
2444 Thrumster
2594 Thuddungra
2732 Thule
2447 Thumb Creek
2640 Thurgoona
2731 Thyra
2622 Tianjara
2422 Tibbuc
2880 Tibooburra
2870 Tichborne
2850 Tichular
2297 Tighes Hill
2546 Tilba Tilba
2350 Tilbuster
2319 Tilligerry Creek
2840 Tilpa
2372 Timbarra
2551 Timbillica
2340 Timbumburi
2338 Timor
2835 Tindarey
2620 Tinderry
2369 Tingha
2290 Tingira Heights
2430 Tinonee
2546 Tinpot
2478 Tintenbar
2352 Tintinhull
2428 Tiona
2429 Tipperary
2424 Tiri
2580 Tirrannaville
2422 Titaatee Creek
2421 Tocal
2714 Tocumwal
2629 Tolbar
2650 Tolland
2622 Tolwong
2322 Tomago
2537 Tomakin
2337 Tomalla
2633 Tombong
2622 Tomboye
2540 Tomerong
2484 Tomewin
2869 Tomingley
2470 Tomki
2446 Toms Creek
2817 Tonderburine
2527 Tongarra
2864 Toogong
2736 Tooleybuc
2534 Toolijooa
2475 Tooloom
2829 Tooloon
2642 Tooma
2146 Toongabbie
2146 Toongabbie East
2830 Toongi
2474 Toonumbar
2734 Tooranie
2817 Tooraweenah
2452 Toormina
2440 Toorooka
2550 Toothdale
2655 Tootool
2261 Toowoon Bay
2423 Topi Topi
2283 Toronto
2371 Torrington
2358 Torryburn
2421 Torryburn
2850 Totnes Valley
2873 Tottenham
2622 Touga
2263 Toukley
2460 Towallum
2550 Towamba
2463 Townsend
2518 Towradgi
2580 Towrang
2620 Tralee
2823 Trangie
2480 Tregeagle
2770 Tregear
2460 Trenayr
2738 Trentham Cliffs
2869 Trewilga
2850 Triamble
2795 Triangle Flat
2875 Trundle
2666 Trungley Hall
2795 Trunkey Creek
2472 Trustums Hill
2365 Tubbamurra
2594 Tubbul
2462 Tucabia
2480 Tucki Tucki
2477 Tuckombil
2480 Tuckurimba
2583 Tuena
2259 Tuggerah
2259 Tuggerawong
2422 Tugrabakh
2732 Tullakool
2874 Tullamore
2540 Tullarwalla
2480 Tullera
2669 Tullibigeal
2527 Tullimbar
2400 Tulloona
2463 Tullymorgan
2653 Tumbarumba
2261 Tumbi Umbi
2729 Tumblong
2490 Tumbulgum
2720 Tumorrama
2720 Tumut
2720 Tumut Plains
2480 Tuncester
2428 Tuncurry
2469 Tunglebung
2480 Tuntable Creek
2714 Tuppal
2548 Tura Beach
2850 Turill
2537 Turlinjah
2440 Turners Flat
2795 Turondale
2630 Tuross
2537 Tuross Head
2074 Turramurra
2390 Turrawan
2205 Turrella
2650 Turvey Park
2485 Tweed Heads
2486 Tweed Heads South
2485 Tweed Heads West
2850 Twelve Mile
2324 Twelve Mile Creek
2540 Twelve Mile Peg
2795 Twenty Forests
2410 Twin Rivers
2852 Two Mile Flat
2481 Tyagarah
2484 Tyalgum
2484 Tyalgum Creek
2484 Tygalgah
2460 Tyndale
2453 Tyringham
2329 Uarbry
2484 Uki
2357 Ulamambri
2850 Ulan
2539 Ulladulla
2850 Ullamalla
2462 Ulmarra
2450 Ulong
2232 Uloola
2007 Ultimo
2257 Umina Beach
2526 Unanderra
2420 Underbank
4380 Undercliffe
2669 Ungarie
2474 Unumgar
2311 Upper Allyn
2404 Upper Bingara
2483 Upper Burringbar
2849 Upper Bylong
2756 Upper Colo
2482 Upper Coopers Creek
2460 Upper Copmanhurst
2456 Upper Corindi
2484 Upper Crystal Creek
2336 Upper Dartbrook
2469 Upper Duck Creek
2486 Upper Duroby
2474 Upper Eden Creek
2460 Upper Fine Flower
2849 Upper Growee
2474 Upper Horseshoe Creek
2347 Upper Horton
2577 Upper Kangaroo River
2577 Upper Kangaroo Valley
2415 Upper Karuah River
2430 Upper Lansdowne
2775 Upper Macdonald
2482 Upper Main Arm
2250 Upper Mangrove
2346 Upper Manilla
2470 Upper Mongogarie
2423 Upper Myall
2849 Upper Nile
2450 Upper Orara
2446 Upper Pappinbarra
2441 Upper Rollands Plains
2336 Upper Rouchel
2447 Upper Taylors Arm
2475 Upper Tooloom
2795 Upper Turon
2482 Upper Wilsons Creek
2439 Upsalls Creek
2477 Uralba
2358 Uralla
2645 Urana
2656 Urangeline
2656 Urangeline East
2652 Uranquinty
2829 Urawilkie
2475 Urbenville
2611 Uriarra
2620 Urila
2484 Urliup
2455 Urunga
2447 Utungun
2421 Vacy
2790 Vale Of Clwydd
2280 Valentine
2454 Valery
2448 Valla
2448 Valla Beach
2777 Valley Heights
2566 Varroville
2030 Vaucluse
2440 Verges Creek
2550 Verona
2163 Villawood
2540 Vincentia
2765 Vineyard
2423 Violet Hill
2799 Vittoria
2172 Voyager Point
2259 Wadalba
2546 Wadbilliga
2474 Wadeville
2650 Wagga Wagga
2650 Wagga Wagga Bc
2651 Wagga Wagga Raaf
2257 Wagstaffe
2076 Wahroonga
2077 Waitara
2443 Waitui
2278 Wakefield
2176 Wakeley
2710 Wakool
2795 Walang
2642 Walbundrie
2354 Walcha
2354 Walcha Road
2800 Waldegrave
2832 Walgett
2343 Walhallow
2659 Walla Walla
2343 Wallabadah
2430 Wallabi Point
2650 Wallacetown
2745 Wallacia
2546 Wallaga Lake
2550 Wallagoot
2320 Wallalong
2340 Wallamore
2422 Wallanbah
2360 Wallangra
2675 Wallanthery
2259 Wallarah
2420 Wallaringa
2420 Wallarobba
2618 Wallaroo
2588 Wallendbeen
2845 Wallerawang
2665 Walleroobie
2428 Wallingat
2428 Wallis Lake
2287 Wallsend
2820 Walmer
2537 Wamban
2830 Wambangalang
2260 Wamberal
2620 Wamboin
2795 Wambool
2630 Wambrook
2840 Wanaaring
2540 Wandandian
2550 Wandella
2360 Wandera
2710 Wandook
2365 Wandsworth
2423 Wang Wauk
2710 Wanganella
2482 Wanganui
2267 Wangi Wangi
2650 Wantabadgery
2644 Wantagong
2663 Wantiool
2550 Wapengo
2304 Warabrook
2298 Waratah
2298 Waratah West
2680 Warburn
2477 Wardell
2484 Wardrop Valley
2350 Wards Mistake
2422 Wards River
2046 Wareemba
2402 Warialda
2402 Warialda Rail
2528 Warilla
2330 Warkworth
2282 Warners Bay
2259 Warnervale
2346 Warrabah
2810 Warraderry
2460 Warragai Creek
2752 Warragamba
2710 Warragoon
2339 Warrah
2339 Warrah Creek
2343 Warrah Ridge
2340 Warral
2423 Warranulla
2074 Warrawee
2680 Warrawidgee
2502 Warrawong
2474 Warrazambil Creek
2469 Warregah Island
2447 Warrell Creek
2824 Warren
2622 Warri
2102 Warriewood
2102 Warriewood Shopping Square
2774 Warrimoo
2100 Warringah Mall
2429 Warriwillah
2871 Warroo
2828 Warrumbungle
2232 Warumbul
2170 Warwick Farm
2425 Washpool
2460 Washpool
2325 Watagan
2259 Watanobbi
2233 Waterfall
2017 Waterloo
2017 Waterloo Dc
2540 Watersleigh
2460 Waterview
2460 Waterview Heights
2030 Watsons Bay
2355 Watsons Creek
2232 Wattamolla
2535 Wattamolla
2794 Wattamondara
2795 Wattle Flat
2173 Wattle Grove
2330 Wattle Ponds
2575 Wattle Ridge
2795 Watton
2446 Wauchope
2711 Waugorah
2422 Waukivory
2024 Waverley
2337 Waverly
2060 Waverton
2447 Way Way
2580 Wayo
2340 Weabonga
2382 Wean
2421 Webbers Creek
2775 Webbs Creek
2560 Wedderburn
2582 Wee Jasper
2388 Wee Waa
2594 Weedallion
2406 Weemelah
2395 Weetaliba
2669 Weethalle
2839 Weilmoringle
2415 Weismantels
2642 Welaregang
2575 Welby
2370 Wellingrove
2820 Wellington
2371 Wellington Vale
2460 Wells Crossing
2250 Wendoree Park
2648 Wentworth
2782 Wentworth Falls
2127 Wentworth Point
2145 Wentworthville
2577 Werai
2720 Wereboldera
2720 Wermatong
2570 Werombi
2534 Werri Beach
2446 Werrikimbe
2747 Werrington
2747 Werrington County
2747 Werrington Downs
2341 Werris Creek
2640 West Albury
2350 West Armidale
2478 West Ballina
2795 West Bathurst
2471 West Bungawalbin
2471 West Coraki
2250 West Gosford
2443 West Haven
2171 West Hoxton
2440 West Kempsey
2541 West Nowra
2125 West Pennant Hills
2073 West Pymble
2114 West Ryde
2340 West Tamworth
2286 West Wallsend
2474 West Wiangaree
2500 West Wollongong
2671 West Wyalong
2330 Westbrook
2340 Westdale
2653 Westdale
2048 Westgate
2120 Westleigh
2145 Westmead
2326 Weston
2729 Westwood
2164 Wetherill Park
2164 Wetherill Park Bc
2734 Wetuppa
2770 Whalan
2107 Whale Beach
2097 Wheeler Heights
2758 Wheeny Creek
2583 Wheeo
2429 Wherrol Flat
2480 Whian Whian
2469 Whiporie
2836 White Cliffs
2795 White Rock
2290 Whitebridge
2460 Whiteman Creek
2404 Whitlow
2330 Whittingham
2705 Whitton
2428 Whoota
2795 Wiagdon
2474 Wiangaree
2580 Wiarborough
2293 Wickham
2328 Widden
2680 Widgelli
2756 Wilberforce
2850 Wilbetree
2836 Wilcannia
2453 Wild Cattle Creek
2577 Wildes Meadow
2195 Wiley Park
2382 Willala
2440 Willawarrin
2680 Willbriggie
2440 Willi Willi
2620 Williamsdale
2318 Williamtown
2653 Willigobung
2423 Willina
2770 Willmot
2068 Willoughby
2068 Willoughby East
2068 Willoughby North
2339 Willow Tree
2534 Willow Vale
2575 Willow Vale
2372 Willsons Downfall
2710 Willurah
2850 Wilpinjong
2482 Wilsons Creek
2624 Wilsons Valley
2571 Wilton
2795 Wimbledon
2346 Wimborne
2795 Winburndale
2306 Windale
2528 Windang
2320 Windella
2580 Windellama
2800 Windera
2321 Windermere
2264 Windermere Park
2850 Windeyer
2720 Windowie
2795 Windradyne
2756 Windsor
2756 Windsor Downs
2343 Windy
2460 Winegrove
2829 Wingadee
2579 Wingello
2337 Wingen
2429 Wingham
2631 Winifred
2777 Winmalee
2153 Winston Hills
2344 Winton
2640 Wirlinga
2849 Wirraba
2420 Wirragulla
2803 Wirrimah
2447 Wirrimbi
2871 Wirrinya
2795 Wisemans Creek
2775 Wisemans Ferry
2440 Wittitrin
2550 Wog Wog
2622 Wog Wog
2422 Woko
2790 Wolgan Valley
2790 Wollangambe
2850 Wollar
2330 Wollemi
2205 Wolli Creek
2581 Wollogorang
2325 Wollombi
2350 Wollomombi
2477 Wollongbar
2500 Wollongong
2500 Wollongong Dc
2500 Wollongong West
2065 Wollstonecraft
2540 Wollumboola
2354 Wollun
2550 Wolumla
2515 Wombarra
2587 Wombat
2460 Wombat Creek
2580 Wombeyan Caves
2731 Womboota
2756 Womerah
2551 Wonboyn
2551 Wonboyn Lake
2551 Wonboyn North
2256 Wondabyne
2729 Wondalga
2831 Wongarbon
2530 Wongawilli
2346 Wongo Creek
2350 Wongwibinda
2322 Woodberry
2560 Woodbine
2472 Woodburn
2538 Woodburn
2767 Woodcroft
2476 Woodenbong
2778 Woodford
2463 Woodford Island
2535 Woodhill
2580 Woodhouselee
2536 Woodlands
2575 Woodlands
2480 Woodlawn
2164 Woodpark
2284 Woodrising
2372 Woodside
2347 Woodsreef
2360 Woodstock
2538 Woodstock
2793 Woodstock
2470 Woodview
2321 Woodville
2466 Woody Head
2354 Woolbrook
2582 Woolgarlo
2456 Woolgoolga
2462 Wooli
2025 Woollahra
2540 Woollamia
2011 Woolloomooloo
2470 Woolners Arm
2340 Woolomin
2337 Woolooma
2230 Woolooware
2464 Wooloweyah
2110 Woolwich
2644 Woomargama
2469 Woombah
2259 Woongarrah
2517 Woonona
2517 Woonona East
2423 Wootton
2483 Wooyung
2850 Worlds End
2232 Woronora
2508 Woronora Dam
2233 Woronora Heights
2540 Worrigee
2540 Worrowing Heights
2256 Woy Woy
2256 Woy Woy Bay
2642 Wrathall
2540 Wrights Beach
2775 Wrights Creek
2820 Wuuluman
2671 Wyalong
2469 Wyan
2622 Wyanbene
2808 Wyangala
2720 Wyangle
2333 Wybong
2259 Wybung
2259 Wyee
2259 Wyee Point
2372 Wylie Creek
2330 Wylies Flat
2640 Wymah
2550 Wyndham
2474 Wyneden
2250 Wyoming
2259 Wyong
2259 Wyong Creek
2259 Wyongah
2480 Wyrallah
2469 Yabbra
2539 Yadboro
2423 Yagon
2199 Yagoona
2580 Yalbraith
2530 Yallah
2408 Yallaroi
2540 Yalwal
2464 Yamba
2550 Yambulla
2703 Yanco
2574 Yanderra
2711 Yanga
2550 Yankees Creek
2343 Yannergee
2840 Yantabulla
2629 Yaouk
2644 Yarara
2580 Yarra
2875 Yarrabandai
2850 Yarrabin
2820 Yarragal
2842 Yarragrin
2650 Yarragundry
2441 Yarrahapinni
2259 Yarramalong
2343 Yarraman
2753 Yarramundi
2447 Yarranbella
2720 Yarrangobilly
2446 Yarras
2795 Yarras
2429 Yarratt Forest
2440 Yarravel
2328 Yarrawa
2233 Yarrawarrah
2850 Yarrawonga
2264 Yarrawonga Park
2388 Yarrie Lake
2620 Yarrow
2370 Yarrowford
2354 Yarrowitch
2358 Yarrowyck
2582 Yass
2582 Yass River
2650 Yathella
2251 Yattalunga
2539 Yatte Yattah
2729 Yaven Creek
2483 Yelgun
2371 Yellow Dam
2548 Yellow Pinch
2777 Yellow Rock
2527 Yellow Rock Ridge
2232 Yenabilli
2681 Yenda
2325 Yengo
2161 Yennora
2868 Yeoval
2642 Yerong Creek
2787 Yerranderie
2575 Yerrinbool
2540 Yerriyong
2440 Yessabah
2795 Yetholme
2410 Yetman
2446 Yippin Creek
2680 Yoogali
2470 Yorklea
2594 Young
2228 Yowie Bay
2550 Yowrie
2867 Yullundry
2464 Yuraygir
2484 Zara
2017 Zetland`;

const NT = `0822 Acacia Hills
0846 Adelaide River
0810 Alawa
0872 Ali Curung
0870 Alice Springs
0872 Alice Springs
4825 Alpurrurulam
0885 Alyangula
0852 Amanbidji
0873 Amoonguna
0872 Ampilatwatja
0872 Anatye
0822 Angurugu
0822 Anindilyakwa
0872 Anmatjere
0812 Anula
0870 Araluen
0830 Archer
0872 Areyonga
0852 Arnold
0873 Arumbera
0872 Atitjere
0852 Baines
0832 Bakewell
0872 Barrow Creek
0852 Barunga
0845 Batchelor
0822 Bathurst Island
0820 Bayview
0822 Bees Creek
0832 Bellamack
0822 Belyuen
0828 Berrimah
0838 Berry Springs
0852 Beswick Creek
0852 Binjari
0852 Birdum
0822 Black Jungle
0822 Blackmore
0854 Borroloola
0852 Bradshaw
0870 Braitling
0810 Brinkin
0852 Buchanan
0812 Buffalo Creek
0852 Bulman Weemol
0822 Burrundie
0872 Burt Plain
0822 Bynoe
0822 Bynoe Harbour
0862 Calvert
0822 Camp Creek
0872 Canteen Creek
0810 Casuarina
0822 Channel Island
0820 Charles Darwin
0822 Charles Darwin
0822 Charlotte
0872 Chilla Well
0870 Ciccone
0822 Claravale
0822 Cobourg
0810 Coconut Grove
0822 Collett Creek
0873 Connellan
0839 Coolalinga
0822 Coomalie Creek
0820 Coonawarra
0850 Cossack
0872 Costello
0822 Cox Peninsula
0852 Creswell
0852 Daguragu
0822 Daly
0822 Daly River
0852 Daly Waters
0800 Darwin City
0820 Darwin Dc
0841 Darwin River
0822 Darwin River Dam
0872 Davenport
0852 Delamere
0870 Desert Springs
0822 Douglas-Daly
0830 Driver
0840 Dundee Beach
0840 Dundee Downs
0840 Dundee Forest
0830 Durack
0822 East Arm
0822 East Arnhem
0820 East Point
0870 East Side
0820 Eaton
0852 Edith
0862 Elliott
0822 Elrundie
0852 Elsey
0850 Emungalan
0872 Engawala
0822 Eva Valley
0820 Fannie Bay
0830 Farrar
0872 Finke
0822 Finniss Valley
0822 Fleming
0852 Florina
0822 Fly Creek
0852 Flying Fox
0875 Flynn
0822 Freds Pass
0822 Galiwinku
0880 Gapuwiyak
0872 Ghan
0870 Gillen
0836 Girraween
0822 Glyde Point
0822 Goulburn Island
0830 Gray
0852 Gregory
0852 Gulung Mardrulk
0822 Gunbalanya
0832 Gunn
0822 Gunn Point
0880 Gunyangara
0852 Gurindji
0872 Haasts Bluff
0872 Hale
0872 Hart
0873 Heavitree Gap Cpa
0852 Helen Springs Station
0836 Herbert
0872 Hermannsburg
0822 Hidden Valley
0812 Holmes
0829 Holtze
0822 Hotham
0835 Howard Springs
0872 Hugh
0822 Hughes
0836 Humpty Doo
0873 Ilparpa
0872 Imanpa
0872 Ininti Store
0874 Irlpme
0886 Jabiru
0852 Jilkminggan
0810 Jingili
0832 Johnston
0822 Kakadu
0852 Kalkarindji
0872 Kaltukatjara
0812 Karama
0850 Katherine
0852 Katherine
0850 Katherine East
0850 Katherine South
0873 Kilgariff
0872 Kintore
0828 Knuckey Lagoon
0822 Koolpinyah
0872 Kulgera
0872 Kunparrka
0852 Lajamanu
0822 Lake Bennett
0872 Lake Mackay
0822 Lambells Lagoon
0850 Lansdowne
0872 Laramba
0875 Larapinta
0820 Larrakeyah
0852 Larrimah
0812 Leanyer
0810 Lee Point
0852 Limmen
0822 Litchfield Park
0822 Livingstone
0822 Lloyd Creek
0820 Ludmilla
0810 Lyons
0872 Macdonnell Range
0812 Malak
0852 Manbulloo
0822 Mandorah
0822 Maningrida
0837 Manton
0822 Mapuru
0852 Maranboy
0822 Maranunga
0822 Margaret River
0830 Marlow Lagoon
0822 Marrakai
0812 Marrara
0852 Mataranka
0852 McArthur
0822 McMinns Lagoon
0872 Mereenie
0822 Micket Creek
0822 Middle Point
0822 Milikapiti
0822 Milingimbi
0810 Millner
0822 Milyakburra
0852 Miniyerri
0822 Minjilang
0832 Mitchell
0810 Moil
0830 Moulden
0822 Mount Bundey
0874 Mount Johns
0872 Mount Liebig
0872 Mount Zeil
0810 Muirhead
0822 Murrumujuk
0872 Mutitjulu
0810 Nakara
0872 Namatjira
0872 Napperby Station
0822 Nauiyu
0822 Nemarluk
0862 Newcastle Waters
0822 Nganmarriyanga
0852 Ngukurr
0880 Nhulunbuy
0862 Nicholson
0810 Nightcliff
0852 Nitjpurru
0852 Nitmiluk
0837 Noonamah
0822 Numbulwar
0822 Numburindi
0852 Nutwood Downs
0872 Nyirripi
0822 Oenpelli
0830 Palmerston City
0862 Pamayu
0872 Papunya
0820 Parap
0852 Pellew Islands
0822 Peppimenarti
0872 Petermann
0847 Pine Creek
0829 Pinelands
0822 Pirlangimpi
0822 Point Stuart
0822 Pularumpi
0822 Rakula
0822 Ramingining
4825 Ranken
0810 Rapid Creek
0822 Robin Falls
0852 Robinson River
0832 Rosebery
0873 Ross
0822 Rum Jungle
0870 Sadadeen
0872 Sandover
0822 Sandpalms Roadhouse
0872 Santa Teresa
0830 Shoal Bay
0872 Simpson
0822 Southport
0822 Stapleton
0870 Stuart
0820 Stuart Park
0852 Sturt Plateau
0862 Tablelands
0872 Tanami
0852 Tanami East
0872 Tara
0872 Telegraph Station
0860 Tennant Creek
0862 Tennant Creek
0822 Thamarrurr
0870 The Gap
0820 The Gardens
0820 The Narrows
0872 Ti Tree
0852 Timber Creek
0853 Tindal
0822 Tipperary
0872 Titjikala
0822 Tivendale
0810 Tiwi
0822 Tiwi Islands
0852 Top Springs
0822 Tortilla Flats
0822 Tumbling Waters
0822 Umbakumba
0874 Undoolya
0852 Uralla
0852 Venn
0822 Vernon Islands
0852 Victoria River
0834 Virginia
0822 Wadeye
0822 Wagait Beach
0810 Wagaman
0822 Wak Wak
0872 Wallace Rockhole
0810 Wanguri
0822 Warruwi
0852 Warumungu
0822 Weddell
0822 West Arnhem
0870 White Gums
0822 Wickham
0872 Willowra
0872 Wilora
0852 Wilton
0820 Winnellie
0822 Winnellie
0822 Wishart
0830 Woodroffe
0820 Woolner
0852 Wugularr
0812 Wulagi
0822 Wurrumiyanga
0872 Wutunugurra
0852 Yarralin
0830 Yarrawonga
0880 Yirrkala
0872 Yuelamu
0872 Yuendumu
0872 Yulara
0832 Zuccoli`;

const QLD = `4613 Abbeywood
4670 Abbotsford
4627 Abercorn
4850 Abergowrie
4892 Abingdon Downs
4660 Abington
4110 Acacia Ridge
4401 Acland
4343 Adare
4474 Adavale
4703 Adelaide Park
4211 Advancetown
4870 Aeroglen
4677 Agnes Water
4807 Airdmillan
4802 Airlie Beach
4807 Airville
4814 Aitkenvale
4820 Alabama Hill
4035 Albany Creek
4702 Alberta
4207 Alberton
4722 Albinia
4010 Albion
4822 Albion
4010 Albion Bc
4010 Albion Dc
4051 Alderley
4650 Aldershot
4694 Aldoga
4740 Alexandra
4572 Alexandra Headland
4161 Alexandra Hills
4115 Algester
4610 Alice Creek
4817 Alice River
4370 Allan
4310 Allandale
4700 Allenstown
4285 Allenview
4740 Alligator Creek
4816 Alligator Creek
4850 Allingham
4362 Allora
4670 Alloway
4871 Almaden
4871 Aloomba
4724 Alpha
4702 Alsace
4702 Alton Downs
4807 Alva
4570 Amamoor
4570 Amamoor Creek
4829 Amaroo
4871 Amber
4306 Amberley
4695 Ambrose
4462 Amby
4380 Amiens
4183 Amity
4183 Amity Point
4702 Anakie Siding
4740 Andergrove
4570 Anderleigh
4800 Andromache
4355 Anduramba
4814 Annandale
4103 Annerley
4070 Anstead
4310 Anthony
4650 Antigua
4660 Apple Tree Creek
4378 Applethorpe
4570 Araluen
4726 Aramac
4620 Aramara
4054 Arana Hills
4625 Aranbanga
4309 Aratula
4892 Arbouin
4819 Arcadia
4454 Arcadia Valley
4892 Archer River
4108 Archerfield
4108 Archerfield Bc
4702 Arcturus
4721 Argyll
4737 Armstrong Beach
4520 Armstrong Creek
4551 Aroona
4880 Arriga
4214 Arundel
4214 Arundel Dc
4007 Ascot
4359 Ascot
4670 Ashfield
4060 Ashgrove
4060 Ashgrove East
4214 Ashmore
4214 Ashmore City
4340 Ashwell
4034 Aspley
4883 Atherton
4350 Athol
4311 Atkinsons Dam
4401 Aubigny
4413 Auburn
4066 Auchenflower
4477 Augathella
4300 Augustine Heights
4892 Aurukun
4213 Austinville
4215 Australia Fair
4670 Avenell Heights
4670 Avoca
4314 Avoca Vale
4670 Avondale
4807 Ayr
4895 Ayton
4861 Babinda
4361 Back Plains
4875 Badu Island
4674 Baffle Creek
4454 Baffle West
4207 Bahrs Scrub
4699 Bajool
4470 Bakers Bend
4740 Bakers Creek
4413 Baking Board
4740 Balberra
4702 Balcomba
4036 Bald Hills
4552 Bald Knob
4816 Balgal Beach
4401 Balgowan
4741 Ball Bay
4382 Ballandean
4352 Ballard
4455 Ballaroo
4610 Ballogie
4171 Balmoral
4552 Balmoral Ridge
4740 Balnagowan
4876 Bamaga
4850 Bambaroo
4873 Bamboo
4860 Bamboo Creek
4625 Ban Ban
4625 Ban Ban Springs
4702 Banana
4630 Bancroft
4703 Bangalee
4306 Banks Creek
4570 Banks Pocket
4507 Banksia Beach
4207 Bannockburn
4551 Banya
4014 Banyo
4352 Bapaume
4413 Barakula
4702 Baralaba
4601 Barambah
4725 Barcaldine
4065 Bardon
4714 Baree
4306 Barellan Point
4670 Bargara
4465 Bargunyah
4551 Baringa
4615 Barker Creek Flat
4825 Barkly
4605 Barlil
4703 Barlows Hill
4625 Barlyne
4703 Barmaryee
4703 Barmoya
4702 Barnard
4680 Barney Point
4287 Barney View
4420 Baroondah
4416 Barramornie
4809 Barratta
4872 Barrine
4816 Barringha
4490 Barringun
4878 Barron
4870 Barron Gorge
4861 Bartle Frere
4872 Barwidgi
4820 Basalt
4871 Basilisk
4305 Basin Pocket
4551 Battery Hill
4718 Bauhinia
4650 Bauple
4650 Bauple Forest
4478 Bayrick
4868 Bayview Heights
4818 Beach Holm
4510 Beachmere
4740 Beaconsfield
4886 Beatrice
4285 Beaudesert
4650 Beaver Rock
4829 Bedourie
4385 Beebo
4680 Beecher
4211 Beechmont
4405 Beelbee
4659 Beelbi Creek
4570 Beenaam Valley
4207 Beenleigh
4517 Beerburrum
4626 Beeron
4519 Beerwah
4487 Begonia
4454 Beilba
4723 Belcong
4810 Belgian Gardens
4207 Belivah
4408 Bell
4570 Bella Creek
4507 Bellara
4300 Bellbird Park
4070 Bellbowrie
4871 Bellenden Ker
4892 Bellevue
4822 Bellfield
4562 Belli Park
4510 Bellmere
4570 Bells Bridge
4551 Bells Creek
4514 Bellthorpe
4153 Belmont
4740 Belmunda
4860 Belvedere
4721 Belyando
4850 Bemerside
4610 Benair
4680 Benaraby
4314 Benarkin
4314 Benarkin North
4754 Benholme
4275 Benobble
4217 Benowa
4869 Bentley Park
4674 Berajondo
4362 Berat
4353 Bergen
4117 Berrinba
4701 Berserker
4205 Bethania
4313 Biarra
4880 Biboohra
4275 Biddaddaba
4401 Biddeston
4650 Bidwill
4621 Biggenden
4216 Biggera Waters
4225 Bilinga
4390 Billa Billa
4715 Biloela
4854 Bilyana
4488 Bindebango
4702 Bingegang
4852 Bingil Bay
4625 Binjour
4211 Binna Burra
4482 Birdsville
4854 Birkalla
4159 Birkdale
4285 Birnam
4352 Birnam
4575 Birtinya
4343 Black Duck Creek
4820 Black Jack
4563 Black Mountain
4818 Black River
4600 Black Snake
4472 Blackall
4871 Blackbull
4314 Blackbutt
4314 Blackbutt North
4314 Blackbutt South
4702 Blackdown
4850 Blackrock
4740 Blacks Beach
4306 Blacksoil
4304 Blackstone
4413 Blackswamp
4717 Blackwater
4625 Blairmore
4352 Blanchview
4310 Blantyre
4405 Blaxland
4341 Blenheim
4560 Bli Bli
4895 Bloomfield
4799 Bloomsbury
4818 Blue Hills
4737 Blue Mountain
4350 Blue Mountain Heights
4818 Bluewater
4818 Bluewater Park
4702 Bluff
4455 Blythdale
4468 Boatman
4425 Bogandilla
4805 Bogie
4818 Bohle
4817 Bohle Plains
4875 Boigu Island
4575 Bokarina
4570 Bollier
4488 Bollon
4871 Bolwarra
4871 Bombeeta
4625 Bon Accord
4703 Bondoola
4507 Bongaree
4356 Bongeen
4873 Bonnie Doon
4213 Bonogin
4385 Bonshaw
4370 Bony Mountain
4401 Boodua
4871 Boogan
4610 Booie
4671 Boolboonda
4702 Boolburra
4621 Boompa
4310 Boonah
4601 Boonara
4413 Boonarga
4034 Boondall
4406 Boondandilla
4613 Boondooma
4650 Boonooroo
4650 Boonooroo Plains
4655 Booral
4552 Booroobin
4601 Booubyjan
4304 Booval
4304 Booval Fair
4671 Booyal
4306 Borallon
4565 Boreen Point
4124 Boronia Heights
4678 Bororen
4714 Boulder Creek
4702 Bouldercombe
4829 Boulia
4805 Bowen
4006 Bowen Hills
4404 Bowenville
4275 Boyland
4680 Boyne Island
4680 Boyne Valley
4680 Boynedale
4610 Boyneside
4626 Boynewood
4512 Bracalba
4695 Bracewell
4017 Bracken Ridge
4850 Braemeadows
4313 Braemore
4871 Bramston Beach
4625 Branch Creek
4352 Branchview
4808 Brandon
4800 Brandy Creek
4670 Branyan
4305 Brassall
4500 Bray Park
4800 Breadalbane
4825 Breakaway
4820 Breddan
4500 Brendale
4500 Brendale Bc
4500 Brendale Dc
4507 Bribie Island
4507 Bribie Island North
4035 Bridgeman Downs
4561 Bridges
4412 Brigalow
4741 Brightly
4017 Brighton
4017 Brighton Eventide
4017 Brighton Nathan Street
4311 Brightview
4613 Brigooda
4357 Bringalily
4870 Brinsmead
4000 Brisbane Adelaide Street
4008 Brisbane Airport
4000 Brisbane City
4106 Brisbane Market
4218 Broadbeach
4218 Broadbeach Waters
4420 Broadmere
4380 Broadwater
4757 Broken River
4285 Bromelton
4069 Brookfield
4816 Brookhill
4615 Brooklands
4053 Brookside Centre
4364 Brookstead
4300 Brookwater
4570 Brooloo
4620 Brooweena
4820 Broughton
4626 Brovinia
4118 Browns Plains
4356 Broxburn
4387 Brush Creek
4312 Bryden
4403 Brymaroo
4311 Buaraba
4311 Buaraba South
4750 Bucasia
4670 Bucca
4207 Buccan
4825 Buckingham
4722 Buckland
4575 Buddina
4556 Buderim
4359 Budgee
4630 Bukali
4854 Bulgun
4171 Bulimba
4615 Bullcamp
4871 Bulleringa
4357 Bulli Creek
4492 Bulloo Downs
4671 Bullyard
4025 Bulwer
4310 Bunburra
4670 Bundaberg
4670 Bundaberg Central
4670 Bundaberg Dc
4670 Bundaberg East
4670 Bundaberg North
4670 Bundaberg South
4670 Bundaberg West
4217 Bundall
4217 Bundall Dc
4304 Bundamba
4419 Bundi
4723 Bundoora
4419 Bungaban
4671 Bungadoo
4870 Bungalow
4455 Bungeworgorai
4455 Bungil
4703 Bungundarra
4494 Bungunya
4310 Bunjurgen
4055 Bunya
4655 Bunya Creek
4405 Bunya Mountains
4156 Burbank
4818 Burdell
4659 Burgowan
4830 Burketown
4822 Burleigh
4220 Burleigh Dc
4220 Burleigh Heads
4220 Burleigh Town
4220 Burleigh Waters
4413 Burncluith
4310 Burnett Creek
4670 Burnett Heads
4560 Burnside
4505 Burpengary
4505 Burpengary Dc
4505 Burpengary East
4410 Burra Burri
4875 Burrar Islet
4659 Burrum Heads
4659 Burrum River
4659 Burrum Town
4742 Burton
4680 Burua
4818 Bushland Beach
4702 Bushley
4885 Butchers Creek
4660 Buxton
4387 Bybera
4605 Byee
4680 Byellee
4703 Byfield
4455 Bymount
4625 Byrnestown
4352 Cabarlah
4510 Caboolture
4510 Caboolture Bc
4510 Caboolture South
4312 Caboonbah
4413 Cadarga
4343 Caffey
4285 Cainbable
4722 Cairdbeign
4870 Cairns
4870 Cairns City
4870 Cairns Dc
4870 Cairns Mc
4872 Cairns Mc
4870 Cairns McLeod Street
4870 Cairns North
4116 Calamvale
4670 Calavos
4816 Calcium
4478 Caldervale
4798 Calen
4570 Calgoa
4570 Calico Creek
4390 Calingunee
4390 Callandoon
4680 Callemondah
4715 Callide
4680 Calliope
4551 Caloundra
4551 Caloundra Dc
4551 Caloundra West
4340 Calvert
4719 Camboon
4358 Cambooya
4822 Cambridge
4552 Cambroon
4413 Cameby
4492 Cameron Corner
4300 Camira
4828 Camooweal
4871 Camp Creek
4152 Camp Hill
4520 Camp Mountain
4820 Campaspe
4625 Campbell Creek
4521 Campbells Pocket
4737 Campwin Beach
4413 Canaga
4702 Canal Creek
4630 Cania
4570 Canina
4630 Cannindah
4357 Canning Creek
4370 Canningvale
4310 Cannon Creek
4380 Cannon Creek
4170 Cannon Hill
4800 Cannon Valley
4802 Cannonvale
4702 Canoona
4275 Canungra
4157 Capalaba
4157 Capalaba Bc
4157 Capalaba Dc
4810 Cape Cleveland
4800 Cape Conway
4800 Cape Gloucester
4740 Cape Hillsborough
4873 Cape Tribulation
4723 Capella
4677 Captain Creek
4357 Captains Mountain
4878 Caravonica
4723 Carbine Creek
4130 Carbrook
4854 Cardstone
4849 Cardwell
4152 Carina
4152 Carina Heights
4152 Carindale
4739 Carmila
4852 Carmoo
4702 Carnarvon Park
4310 Carneys Creek
4300 Carole Park
4477 Caroline Crossing
4344 Carpendale
4823 Carpentaria
4825 Carrandotta
4211 Carrara
4883 Carrington
4849 Carruchan
4034 Carseldine
4806 Carstairs
4563 Carters Ridge
4500 Cashmere
4873 Cassowary
4567 Castaways Beach
4715 Castle Creek
4810 Castle Hill
4407 Cattle Creek
4626 Cattle Creek
4703 Causeway Lake
4702 Cawarral
4352 Cawdor
4407 Cecil Plains
4207 Cedar Creek
4520 Cedar Creek
4285 Cedar Grove
4570 Cedar Pocket
4285 Cedar Vale
4514 Cedarton
4352 Cement Mills
4350 Centenary Heights
4702 Central Queensland Mc
4701 Central Queensland University
4627 Ceratodus
4610 Chahpingah
4133 Chambers Flat
4413 Chances Plain
4155 Chandler
4069 Chapel Hill
4608 Charlestown
4470 Charleville
4350 Charlton
4309 Charlwood
4820 Charters Towers
4820 Charters Towers City
4570 Chatsworth
4702 Cheeseborough
4068 Chelmer
4606 Chelmsford
4740 Chelona
4627 Cheltenham
4605 Cherbourg
4032 Chermside
4032 Chermside Centre
4032 Chermside South
4032 Chermside West
4314 Cherry Creek
4370 Cherry Gully
4660 Cherwell
4555 Chevallum
4217 Chevron Island
4880 Chewko
4660 Childers
4871 Chillagoe
4413 Chinchilla
4285 Chinghee Creek
4215 Chirn Park
4723 Chirnside
4285 Christmas Creek
4311 Churchable
4305 Churchill
4306 Chuwar
4600 Cinnabar
4211 Clagiraba
4741 Clairview
4468 Clara Creek
4871 Claraville
4807 Clare
4807 Claredale
4311 Clarendon
4705 Clarke Creek
4011 Clayfield
4226 Clear Island Waters
4500 Clear Mountain
4816 Clemant
4721 Clermont
4163 Cleveland
4163 Cleveland Dc
4427 Clifford
4350 Clifford Gardens
4361 Clifton
4879 Clifton Beach
4680 Clinton
4370 Clintonvale
4824 Cloncurry
4019 Clontarf
4357 Clontarf
4019 Clontarf Beach
4019 Clontarf Dc
4520 Closeburn
4605 Cloyna
4811 Cluden
4309 Clumber
4312 Coal Creek
4352 Coalbank
4305 Coalfalls
4621 Coalstoun Lakes
4605 Cobbs Hill
4703 Cobraball
4419 Cockatoo
4875 Coconut Island
4860 Coconuts
4892 Coen
4560 Coes Creek
4570 Coles Creek
4808 Colevale
4307 Coleyville
4314 Colinton
4707 Collaroy
4343 College View
4301 Collingwood Park
4804 Collinsville
4677 Colosseum
4820 Columbia
4415 Columboola
4702 Comet
4514 Commissioners Flat
4571 Como
4858 Comoon Loop
4722 Cona Creek
4416 Condamine
4357 Condamine Farms
4352 Condamine Plains
4815 Condon
4871 Conjuboy
4552 Conondale
4702 Consuelo
4800 Conway
4800 Conway Beach
4184 Coochiemudlo Island
4310 Coochin
4519 Coochin Creek
4703 Cooee Bay
4313 Cooeeimbardi
4895 Cooktown
4574 Coolabine
4610 Coolabunia
4479 Cooladdi
4311 Coolana
4225 Coolangatta
4850 Coolbie
4387 Coolmunda
4580 Cooloola
4580 Cooloola Cove
4560 Cooloolabin
4573 Coolum Beach
4216 Coombabah
4209 Coomera
4630 Coominglah
4630 Coominglah Forest
4311 Coominya
4702 Coomoo
4422 Coomrith
4626 Coonambula
4670 Coonarr
4570 Coondoo
4490 Coongoola
4108 Coopers Plains
4420 Coorada
4569 Cooran
4408 Cooranga
4565 Cooroibah
4860 Cooroo Lands
4702 Coorooman
4563 Cooroy
4563 Cooroy Mountain
4151 Coorparoo
4151 Coorparoo Dc
4860 Coorumba
4702 Coorumbene
4565 Cootharaba
4702 Coowonga
4873 Cooya Beach
4402 Cooyar
4741 Coppabella
4860 Coquette Point
4670 Coral Cove
4740 Coral Sea
4871 Coralie
4551 Corbould Park
4660 Cordalba
4850 Cordelia
4570 Corella
4733 Corfield
4075 Corinda
4621 Coringa
4610 Corndale
4130 Cornubia
4455 Cornwall
4513 Corymbia
4818 Cosgrove
4723 Cotherstone
4350 Cotswold Hills
4558 Cotton Tree
4375 Cottonvale
4310 Coulson
4613 Coverty
4873 Cow Bay
4025 Cowan Cowan
4871 Cowley
4871 Cowley Beach
4871 Cowley Creek
4719 Cracow
4877 Craiglie
4655 Craignish
4814 Cranbrook
4350 Cranley
4610 Crawford
4757 Crediton
4740 Cremorne
4313 Cressbrook
4355 Cressbrook Creek
4132 Crestmead
4723 Crinum
4310 Croftby
4519 Crohamhurst
4809 Cromarty
4312 Crossdale
4413 Crossroads
4342 Crowley Vale
4605 Crownthorpe
4355 Crows Nest
4871 Croydon
4285 Cryna
4800 Crystal Brook
4816 Crystal Creek
4552 Crystal Waters
4871 Crystalbrook
4860 Cullinane
4816 Cungulla
4490 Cunnamulla
4370 Cunningham
4570 Curra
4871 Currajah
4812 Currajong
4552 Curramore
4551 Currimundi
4223 Currumbin
4223 Currumbin Valley
4223 Currumbin Waters
4680 Curtis Island
4608 Cushnie
4352 Cutella
4490 Cuttaburra
4627 Cynthia
4357 Cypress Gardens
4873 Dagmar
4570 Dagun
4873 Daintree
4127 Daisy Hill
4825 Dajarra
4503 Dakabin
4715 Dakenba
4807 Dalbeg
4405 Dalby
4380 Dalcouth
4630 Dalga
4621 Dallarnil
4702 Dalma
4850 Dalrymple Creek
4757 Dalrymple Heights
4374 Dalveen
4415 Dalwogon
4671 Dalysford
4671 Damascus
4849 Damper Creek
4872 Danbulla
4370 Danderoo
4610 Dangore
4860 Daradgee
4455 Dargal Road
4350 Darling Heights
4285 Darlington
4410 Darr Creek
4076 Darra
4695 Darts Creek
4875 Dauan Island
4855 Daveson
4521 Dayboro
4497 Daymar
4017 Deagon
4508 Deception Bay
4873 Dedin
4306 Deebing Heights
4625 Deep Creek
4674 Deepwater
4818 Deeragun
4871 Deeral
4895 Degarra
4621 Degilbo
4671 Delan
4514 Delaneys Creek
4700 Depot Hill
4626 Derri Derra
4352 Derrymore
4871 Desailly
4362 Deuchar
4753 Devereux Creek
4401 Devon Park
4735 Diamantina Lakes
4553 Diamond Valley
4380 Diamondvale
4410 Diamondy
4551 Dicky Beach
4621 Didcot
4559 Diddillibah
4680 Diglum
4872 Dimbulah
4702 Dingo
4800 Dingo Beach
4854 Dingo Pocket
4303 Dinmore
4625 Dirnbir
4486 Dirranbandi
4800 Dittmer
4873 Diwan
4702 Dixalea
4892 Dixie
4854 Djarawong
4852 Djiru
4352 Djuan
4352 Doctor Creek
4740 Dolphin Heads
4357 Domville
4510 Donnybrook
4077 Doolandella
4660 Doolbi
4830 Doomadgee
4562 Doonan
4620 Doongul
4820 Dotswood
4671 Doughboy
4354 Douglas
4814 Douglas
4875 Dowar Islet
4570 Downsfield
4754 Dows Creek
4520 Draper
4350 Drayton
4350 Drayton North
4116 Drewvale
4424 Drillham
4424 Drillham South
4671 Drinan
4718 Dromedary
4712 Duaringa
4825 Duchess
4650 Duckinwilla
4405 Ducklo
4310 Dugandan
4671 Duingal
4425 Dulacca
4560 Dulong
4702 Dululu
4740 Dumbleton
4715 Dumgree
4702 Dumpy Creek
4625 Dundarrah
4306 Dundas
4650 Dundathu
4655 Dundowran
4655 Dundowran Beach
4852 Dunk
4465 Dunkeld
4650 Dunmora
4407 Dunmore
4740 Dunnrock
4183 Dunwich
4077 Durack
4413 Durah
4492 Durham
4454 Durham Downs
4610 Durong
4102 Dutton Park
4821 Dutton River
4626 Dykehead
4745 Dysart
4009 Eagle Farm
4009 Eagle Farm Bc
4207 Eagleby
4742 Eaglefield
4870 Earlville
4883 East Barron
4169 East Brisbane
4353 East Cooyar
4871 East Creek
4570 East Deep Creek
4695 East End
4854 East Feluga
4359 East Greenmount
4343 East Haldon
4860 East Innisfail
4305 East Ipswich
4740 East Mackay
4615 East Nanango
4860 East Palmerston
4861 East Russell
4350 East Toowoomba
4871 East Trinity
4305 Eastern Heights
4860 Eaton
4037 Eatons Hill
4304 Ebbw Vale
4340 Ebenezer
4207 Edens Landing
4870 Edge Hill
4869 Edmonton
4892 Edward River
4562 Eerwah Vale
4344 Egypt
4627 Eidsvold
4627 Eidsvold East
4627 Eidsvold West
4807 Eight Mile Creek
4113 Eight Mile Plains
4740 Eimeo
4871 Einasleigh
4855 El Arish
4552 Elaman Creek
4221 Elanora
4370 Elbow Valley
4670 Electra
4721 Elgin
4615 Elgin Vale
4655 Eli Waters
4516 Elimbah
4361 Ellangowan
4078 Ellen Grove
4849 Ellerbeck
4610 Ellesmere
4886 Ellinjaa
4362 Ellinthorp
4670 Elliott
4670 Elliott Heads
4879 Ellis Beach
4361 Elphinstone
4742 Elphinstone
4720 Emerald
4355 Emu Creek
4710 Emu Park
4371 Emu Vale
4306 England Creek
4051 Enoggera
4520 Enoggera Reservoir
4741 Epsom
4740 Erakala
4480 Eromanga
4875 Erub Island
4312 Esk
4312 Eskdale
4871 Esmeralda
4702 Etna Creek
4741 Eton
4858 Etty Bay
4860 Eubenangee
4554 Eudlo
4380 Eukey
4674 Euleilah
4491 Eulo
4455 Eumamurrin
4562 Eumundi
4757 Eungella
4757 Eungella Dam
4741 Eungella Hinterland
4854 Euramo
4660 Eureka
4462 Eurella
4677 Eurimbula
4420 Eurombah
4581 Eurong
4455 Euthulla
4874 Evans Landing
4356 Evanslea
4888 Evelyn
4352 Evergreen
4053 Everton Hills
4053 Everton Park
4606 Fairdale
4103 Fairfield
4103 Fairfield Gardens
4306 Fairney View
4700 Fairy Bower
4413 Fairyland
4670 Fairymead
4741 Farleigh
4703 Farnborough
4660 Farnsfield
4481 Farrars Creek
4309 Fassifern
4309 Fassifern Valley
4568 Federal
4358 Felton
4358 Felton South
4854 Feluga
4650 Ferney
4306 Fernvale
4275 Ferny Glen
4055 Ferny Grove
4055 Ferny Hills
4055 Ferny Hills Dc
4606 Ficks Crossing
4825 Fielding
4352 Fifteen Mile
4069 Fig Tree Pocket
4756 Finch Hatton
4873 Finlayvale
4350 Finnie
4825 Fisher
4570 Fishermans Pocket
4871 Fishery Falls
4860 Fitzgerald Creek
4018 Fitzgibbon
4871 Fitzroy Island
4280 Flagstone
4344 Flagstone Creek
4802 Flametree
4560 Flaxton
4381 Fletcher
4714 Fletcher Creek
4375 Fleurbaix
4285 Flinders Lakes
4305 Flinders View
4422 Flinton
4819 Florence Bay
4860 Flying Fish Point
4275 Flying Fox
4343 Fordsdale
4678 Foreshores
4873 Forest Creek
4556 Forest Glen
4342 Forest Hill
4078 Forest Lake
4357 Forest Ridge
4362 Forest Springs
4118 Forestdale
4850 Foresthome
4465 Forestvale
4723 Fork Lagoons
4404 Formartin
4850 Forrest Beach
4871 Forsayth
4006 Fortitude Valley
4872 Forty Mile
4871 Fossilbrook
4740 Foulden
4824 Four Ways
4800 Foxdale
4721 Frankfield
4309 Frazerview
4806 Fredericksfield
4370 Freestone
4310 Frenches Creek
4701 Frenchville
4870 Freshwater
4737 Freshwater Point
4855 Friday Pocket
4313 Fulham
4884 Gadgarra
4671 Gaeta
4551 Gagalba
4300 Gailes
4702 Gainsford
4850 Gairloch
4892 Gamboola
4830 Gangalidda
4814 Garbutt
4814 Garbutt East
4741 Gargett
4702 Garnant
4852 Garners Beach
4860 Garradunga
4850 Garrawalt
4343 Gatton
4211 Gaven
4625 Gayndah
4051 Gaythorne
4034 Geebung
4352 Geham
4721 Gemini Mountains
4871 Georgetown
4825 Georgina
4871 Germantown
4574 Gheerulla
4420 Ghinghinda
4824 Gidya
4620 Gigoomgan
4871 Gilbert River
4208 Gilberton
4871 Gilberton
4314 Gilla
4570 Gilldora
4211 Gilston
4671 Gin Gin
4702 Gindie
4676 Gindoran
4625 Ginoondan
4382 Girraween
4809 Giru
4670 Givelda
4370 Gladfield
4680 Gladstone
4680 Gladstone Central
4680 Gladstone Dc
4680 Gladstone Harbour
4306 Glamorgan Vale
4615 Glan Devon
4570 Glanmire
4518 Glass House Mountains
4570 Glastonbury
4420 Glebe
4885 Glen Allyn
4381 Glen Aplin
4871 Glen Boughton
4342 Glen Cairn
4570 Glen Echo
4680 Glen Eden
4312 Glen Esk
4800 Glen Isla
4377 Glen Niven
4880 Glen Russell
4872 Glen Ruth
4385 Glenarbon
4424 Glenaubyn
4355 Glenaven
4620 Glenbar
4352 Glencoe
4711 Glendale
4743 Glenden
4285 Gleneagle
4740 Glenella
4515 Glenfern
4370 Glengallan
4420 Glenhaughton
4711 Glenlee
4630 Glenleigh
4280 Glenlogan
4380 Glenlyon
4719 Glenmoral
4423 Glenmorgan
4650 Glenorchy
4342 Glenore Grove
4626 Glenrae
4605 Glenrock
4702 Glenroy
4350 Glenvale
4553 Glenview
4570 Glenwood
4511 Godwin Beach
4702 Gogango
4551 Golden Beach
4621 Golden Fleece
4380 Goldfields
4865 Goldsborough
4670 Gooburrum
4671 Good Night
4390 Goodar
4610 Goodger
4300 Goodna
4660 Goodwood
4314 Googa Creek
4856 Goolboo
4306 Goolman
4702 Goomally
4413 Goombi
4570 Goomboorian
4354 Goombungee
4362 Goomburra
4601 Goomeri
4601 Goomeribong
4860 Goondi
4860 Goondi Bend
4860 Goondi Hill
4390 Goondiwindi
4800 Goorganga Creek
4800 Goorganga Plains
4625 Gooroolba
4650 Gootchie
4702 Goovigen
4702 Goowarra
4421 Goranba
4031 Gordon Park
4610 Gordonbrook
4702 Gordonstone
4865 Gordonvale
4352 Gore
4352 Gowrie Junction
4352 Gowrie Little Plain
4350 Gowrie Mountain
4470 Gowrie Station
4702 Gracemere
4075 Graceville
4075 Graceville East
4650 Grahams Creek
4855 Granadilla
4820 Grand Secret
4340 Grandchester
4051 Grange
4815 Granite Vale
4347 Grantham
4650 Granville
4352 Grapetree
4405 Grassdale
4740 Grasstree Beach
4357 Grays Gate
4700 Great Keppel Island
4655 Great Sandy Strait
4865 Green Hill
4871 Green Island
4124 Greenbank
4701 Greenlake
4380 Greenlands
4359 Greenmount
4751 Greenmount
4570 Greens Creek
4120 Greenslopes
4513 Greenstone
4413 Greenswamp
4387 Greenup
4816 Greenvale
4606 Greenview
4401 Greenwood
4313 Gregors Creek
4830 Gregory
4660 Gregory River
4800 Gregory River
4715 Greycliffe
4370 Greymare
4503 Griffin
4892 Groganville
4352 Groomsville
4806 Groper Creek
4419 Grosmont
4627 Grosvenor
4210 Guanaba
4875 Guijar Islet
4812 Gulliver
4855 Gulngai
4418 Guluguba
4154 Gumdale
4815 Gumlow
4805 Gumlu
4570 Gunalda
4650 Gundiah
4620 Gungaloon
4872 Gunnawarra
4455 Gunnewin
4825 Gunpowder
4892 Gununa
4800 Gunyarra
4626 Gurgeena
4415 Gurulmundi
4805 Guthalungra
4420 Gwambegwine
4570 Gympie
4570 Gympie Dc
4740 Habana
4353 Haden
4306 Haigslea
4742 Hail Creek
4740 Haliday Bay
4850 Halifax
4406 Halliford
4610 Haly Creek
4007 Hamilton
4007 Hamilton Central
4714 Hamilton Creek
4800 Hamilton Plains
4741 Hampden
4352 Hampton
4406 Hannaford
4825 Happy Valley
4350 Harlaxton
4314 Harlin
4630 Harrami
4625 Harriet
4350 Harristown
4307 Harrisville
4341 Hatton Vale
4850 Hawkins Creek
4626 Hawkwood
4171 Hawthorne
4740 Hay Point
4515 Hazeldean
4741 Hazledean
4361 Headington Hill
4825 Healy
4110 Heathwood
4110 Heathwood Df
4814 Heatley
4486 Hebel
4850 Helens Hill
4212 Helensvale
4212 Helensvale Town Centre
4895 Helenvale
4344 Helidon
4344 Helidon Spa
4174 Hemmant
4362 Hendon
4011 Hendra
4887 Herberton
4118 Heritage Park
4812 Hermit Park
4680 Heron Island
4006 Herston
4655 Hervey Bay
4655 Hervey Bay Dc
4817 Hervey Range
4723 Hibernia
4703 Hidden Valley
4800 Hideaway Bay
4892 Highbury
4352 Highfields
4101 Highgate Hill
4352 Highgrove
4211 Highland Park
4401 Highland Plains
4454 Highland Plains
4520 Highvale
4560 Highworth
4118 Hillcrest
4285 Hillview
4849 Hinchinbrook
4359 Hirstglen
4612 Hivesville
4610 Hodgleigh
4455 Hodgson
4352 Hodgson Vale
4121 Holland Park
4121 Holland Park East
4121 Holland Park West
4878 Holloways Beach
4216 Hollywell
4207 Holmview
4892 Holroyd River
4806 Home Hill
4740 Homebush
4816 Homestead
4415 Hookswood
4212 Hope Island
4895 Hope Vale
4413 Hopeland
4875 Horn
4671 Horse Camp
4714 Horse Creek
4819 Horseshoe Bay
4809 Horseshoe Lagoon
4660 Horton
4659 Howard
4890 Howitt
4310 Hoya
4860 Hudson
4821 Hughenden
4854 Hull Heads
4702 Humboldt
4490 Humeburn
4625 Humphery
4555 Hunchy
4493 Hungerford
4871 Hurricane
4454 Hutton Creek
4812 Hyde Park
4875 Iama Island
4811 Idalia
4625 Ideraway
4738 Ilbilbie
4727 Ilfracombe
4554 Ilkley
4275 Illinbah
4560 Image Flat
4570 Imbil
4077 Inala
4077 Inala Heights
4068 Indooroopilly
4068 Indooroopilly Centre
4850 Ingham
4422 Inglestone
4387 Inglewood
4343 Ingoldsby
4876 Injinoo
4454 Injune
4806 Inkerman
4670 Innes Park
4860 Innisfail
4860 Innisfail Estate
4285 Innisplain
4872 Innot Hot Springs
4581 Inskip
4610 Inverlaw
4703 Inverness
4305 Ipswich
4344 Iredale
4892 Iron Range
4306 Ironbark
4356 Irongate
4610 Ironpot
4701 Ironpot
4887 Irvinebank
4404 Irvingdale
4660 Isis Central
4660 Isis River
4731 Isisford
4719 Isla
4650 Island Plantation
4217 Isle Of Capri
4680 Iveragh
4313 Ivory Creek
4426 Jackson
4426 Jackson North
4426 Jackson South
4208 Jacobs Well
4855 Jaffa
4885 Jaggan
4702 Jambin
4074 Jamboree Heights
4811 James Cook University
4410 Jandowae
4856 Japoonvale
4702 Jardine
4874 Jardine River
4854 Jarra Creek
4807 Jarvisfield
4340 Jeebropilly
4702 Jellinbah
4818 Jensen
4728 Jericho
4809 Jerona
4280 Jimboomba
4406 Jimbour
4406 Jimbour East
4406 Jimbour West
4515 Jimna
4074 Jindalee
4410 Jinghi
4490 Jobs Gate
4714 Johnsons Hill
4615 Johnstown
4520 Jollys Lookout
4403 Jondaryan
4355 Jones Gully
4570 Jones Hill
4285 Josephville
4702 Joskeleigh
4500 Joyner
4860 Jubilee Heights
4802 Jubilee Pocket
4816 Julago
4871 Julatten
4823 Julia Creek
4370 Junabee
4343 Junction View
4736 Jundah
4888 Kaban
4702 Kabra
4285 Kagaru
4406 Kaimkillenbun
4872 Kairi
4702 Kalapa
4309 Kalbar
4030 Kalinga
4825 Kalkadoon
4670 Kalkie
4503 Kallangur
4630 Kalpowar
4887 Kalunga
4870 Kamerunga
4570 Kandanga
4570 Kandanga Creek
4169 Kangaroo Point
4570 Kanigan
4870 Kanimbla
4630 Kapaldo
4306 Karalee
4306 Karana Downs
4352 Karara
4117 Karawatha
4306 Karrabin
4184 Karragarra Island
4871 Karron
4891 Karumba
4701 Kawana
4612 Kawl Kawl
4655 Kawungan
4350 Kearneys Spring
4031 Kedron
4800 Kelsey Creek
4815 Kelso
4059 Kelvin Grove
4059 Kelvin Grove Dc
4401 Kelvinhaugh
4742 Kemmis
4574 Kenilworth
4069 Kenmore
4069 Kenmore Dc
4069 Kenmore East
4069 Kenmore Hills
4849 Kennedy
4670 Kensington
4341 Kensington Grove
4309 Kents Lagoon
4310 Kents Pocket
4341 Kentville
4054 Keperra
4670 Kepnock
4702 Keppel Sands
4875 Keriri Island
4285 Kerry
4740 Keswick Island
4879 Kewarra Beach
4612 Keysland
4306 Kholo
4723 Khosh Bulduk
4570 Kia Ora
4560 Kiamba
4718 Kianga
4574 Kidaman Creek
4559 Kiels Mountain
4354 Kilbirnie
4515 Kilcoy
4721 Kilcummin
4600 Kilkivan
4877 Killaloe
4373 Killarney
4465 Kilmorey Falls
4873 Kimberley
4571 Kin Kin
4680 Kin Kora
4601 Kinbombi
4741 Kinchant Dam
4356 Kincora
4390 Kindon
4521 King Scrub
4515 Kingaham
4610 Kingaroy
4610 Kingaroy Dc
4655 Kingfisher Bay Resort
4551 Kings Beach
4361 Kings Creek
4401 Kings Siding
4208 Kingsholme
4400 Kingsthorpe
4114 Kingston
4703 Kinka Beach
4670 Kinkuna
4613 Kinleymore
4420 Kinnoul
4498 Kioma
4021 Kippa-Ring
4806 Kirknie
4680 Kirkwood
4872 Kirrama
4817 Kirwan
4605 Kitoba
4352 Kleinton
4285 Knapp Creek
4881 Koah
4520 Kobble Creek
4406 Kogan
4702 Kokotungo
4671 Kolonga
4872 Koombooloomba
4701 Koongal
4285 Kooralbyn
4402 Kooralgin
4025 Kooringal
4854 Kooroomool
4357 Kooroongarra
4738 Koumala
4892 Kowanyama
4415 Kowguran
4413 Kragra
4875 Kubin
4560 Kulangoor
4309 Kulgun
4660 Kullogum
4352 Kulpi
4558 Kuluin
4405 Kumbarilla
4610 Kumbia
4556 Kunda Park
4615 Kunioon
4702 Kunwarara
4112 Kuraby
4881 Kuranda
4560 Kureelpa
4885 Kureen
4824 Kuridala
4871 Kurrimine Beach
4352 Kurrowah
4388 Kurumbul
4503 Kurwongbah
4741 Kuttabul
4570 Kybong
4823 Kynuna
4380 Kyoomba
4215 Labrador
4521 Laceys Creek
4721 Laglan
4570 Lagoon Pocket
4800 Laguna Quays
4341 Laidley
4341 Laidley Creek West
4341 Laidley Heights
4341 Laidley North
4341 Laidley South
4884 Lake Barrine
4570 Lake Borumba
4343 Lake Clarendon
4884 Lake Eacham
4563 Lake Macdonald
4306 Lake Manchester
4703 Lake Mary
4671 Lake Monduran
4800 Lake Proserpine
4872 Lake Tinaroo
4311 Lake Wivenhoe
4892 Lakefield
4871 Lakeland
4871 Lakeland Downs
4701 Lakes Creek
4621 Lakeside
4184 Lamb Island
4870 Lamb Range
4285 Lamington
4703 Lammermoor
4555 Landers Shoot
4550 Landsborough
4340 Lanefield
4410 Langlands
4630 Langley
4470 Langlo
4570 Langshaw
4850 Lannercost
4478 Lansdowne
4825 Lanskey
4110 Larapinta
4285 Laravale
4306 Lark Hill
4892 Laura
4357 Lavelle
4343 Lawes
4716 Lawgi Dawes
4825 Lawn Hill
4501 Lawnton
4606 Leafdale
4343 Lefthand Branch
4305 Leichhardt
4357 Lemontree
4370 Leslie
4370 Leslie Dam
4800 Lethebrook
4365 Leyburn
4714 Leydens Hill
4344 Lilydale
4352 Lilyvale
4723 Lilyvale
4513 Lilywood
4714 Limestone
4701 Limestone Creek
4305 Limestone Ridges
4384 Limevale
4490 Linden
4356 Linthorpe
4314 Linville
4551 Little Mountain
4865 Little Mulgrave
4892 Lizard
4820 Llanarth
4370 Loch Lomond
4720 Lochington
4892 Lockhart River
4342 Lockrose
4344 Lockyer
4311 Lockyer Waters
4114 Logan Central
4114 Logan City Dc
4133 Logan Reserve
4207 Logan Village
4129 Loganholme
4129 Loganholme Dc
4131 Loganlea
4719 Lonesome Creek
4570 Long Flat
4850 Long Pocket
4730 Longreach
4179 Lota
4705 Lotus Creek
4873 Low Isles
4211 Lower Beechmont
4871 Lower Cowley
4313 Lower Cressbrook
4873 Lower Daintree
4340 Lower Mount Walker
4343 Lower Tenthill
4854 Lower Tully
4570 Lower Wonga
4702 Lowesby
4723 Lowestoff
4676 Lowmead
4311 Lowood
4850 Lucinda
4478 Lumeah
4849 Lumholtz
4390 Lundavra
4207 Luscombe
4030 Lutwyche
4818 Lynam
4871 Lyndhurst
4892 Lyndside
4342 Lynford
4124 Lyons
4382 Lyra
4178 Lytton
4347 Ma Ma Creek
4855 Maadi
4886 Maalan
4650 Maaroom
4875 Mabuiag Island
4406 Macalister
4871 Macalister Range
4478 Macfarlane
4109 Macgregor
4878 Machans Beach
4695 Machine Creek
4740 Mackay
4740 Mackay Caneland
4740 Mackay Dc
4740 Mackay Harbour
4741 Mackay Mc
4740 Mackay North
4740 Mackay South
4740 Mackay West
4156 Mackenzie
4702 Mackenzie
4705 Mackenzie River
4850 Macknade
4352 Maclagan
4184 Macleay Island
4819 Magnetic Island
4650 Magnolia
4385 Maidenhead
4615 Maidenwell
4217 Main Beach
4816 Majors Creek
4885 Malanda
4620 Malarga
4552 Maleny
4352 Malling
4627 Malmoe
4816 Malpas-Trenton
4403 Malu
4871 Mamu
4361 Manapouri
4802 Mandalay
4509 Mango Hill
4179 Manly
4179 Manly West
4610 Mannuem
4870 Manoora
4122 Mansfield
4122 Mansfield Bc
4122 Mansfield Dc
4722 Mantuan Downs
4601 Manumbar
4870 Manunda
4605 Manyung
4560 Mapleton
4874 Mapoon
4892 Maramie
4821 Marathon
4346 Marburg
4564 Marcoola
4573 Marcus Beach
4880 Mareeba
4019 Margate
4019 Margate Beach
4855 Maria Creeks
4753 Marian
4705 Marlborough
4405 Marmadua
4702 Marmor
4570 Marodian
4561 Maroochy River
4558 Maroochydore
4558 Maroochydore Bc
4558 Maroochydore Dc
4310 Maroon
4671 Maroondan
4132 Marsden
4611 Marshlands
4858 Martyville
4650 Maryborough
4650 Maryborough Dc
4650 Maryborough West
4570 Marys Creek
4370 Maryvale
4703 Maryvale
4875 Masig Island
4370 Massie
4210 Maudsland
4822 Maxwelton
4746 May Downs
4856 McCutcheon
4807 McDesme
4053 McDowall
4740 McEwens Beach
4671 McIlwraith
4570 McIntosh Creek
4823 McKinlay
4131 Meadowbrook
4670 Meadowvale
4422 Meandarra
4703 Meikleville Hill
4570 Melawondi
4510 Meldale
4613 Melrose
4610 Memerambi
4871 Mena Creek
4798 Mentmore
4825 Menzies
4875 Mer Island
4551 Meridan Plains
4805 Merinda
4352 Meringandan
4352 Meringandan West
4605 Merlwood
4218 Mermaid Beach
4218 Mermaid Waters
4226 Merrimac
4352 Merritts Creek
4854 Merryburn
4340 Merryvale
4754 Mia Mia
4873 Miallo
4220 Miami
4673 Miara
4825 Mica Creek
4074 Middle Park
4350 Middle Ridge
4886 Middlebrook
4746 Middlemount
4735 Middleton
4799 Midge Point
4702 Midgee
4854 Midgenoo
4852 Midgeree Bar
4860 Mighell
4310 Milbong
4415 Miles
4825 Miles End
4310 Milford
4886 Millaa Millaa
4807 Millaroo
4670 Millbank
4820 Millchester
4357 Millmerran
4357 Millmerran Downs
4357 Millmerran Woods
4888 Millstream
4357 Millwood
4702 Milman
4309 Milora
4064 Milton
4702 Mimosa
4829 Min Min
4886 Minbun
4311 Minden
4722 Minerva
4816 Mingela
4625 Mingo
4380 Mingoola
4872 Minnamoolka
4478 Minnie Downs
4575 Minyama
4754 Mirani
4677 Miriam Vale
4871 Mirriwinni
4361 Missen Flat
4852 Mission Beach
4874 Mission River
4465 Mitchell
4053 Mitchelton
4570 Miva
4875 Moa Island
4551 Moffat Beach
4605 Moffatdale
4070 Moggill
4671 Molangul
4214 Molendinar
4670 Mon Repos
4881 Mona Mona
4807 Mona Park
4630 Monal
4285 Monarch Glen
4671 Monduran
4611 Mondure
4570 Monkland
4626 Monogorilby
4556 Mons
4515 Monsildale
4630 Monto
4370 Montrose
4413 Montrose
4560 Montville
4510 Moodlu
4455 Mooga
4309 Moogerah
4406 Moola
4671 Moolboolaman
4570 Mooloo
4557 Mooloolaba
4553 Mooloolah
4553 Mooloolah Valley
4312 Moombra
4887 Moomin
4605 Moondooner
4630 Moonford
4714 Moongan
4406 Moonie
4340 Moorang
4314 Moore
4670 Moore Park Beach
4305 Moores Pocket
4506 Moorina
4670 Moorland
4870 Mooroobool
4105 Moorooka
4416 Moraby
4744 Moranbah
4506 Morayfield
4886 Moregatta
4871 Moresby
4025 Moreton Island
4370 Morgan Park
4671 Morganville
4702 Morinish
4702 Morinish South
4170 Morningside
4825 Mornington
4343 Morton Vale
4468 Morven
4309 Morwincha
4820 Mosman Park
4387 Mosquito Creek
4873 Mossman
4873 Mossman Gorge
4570 Mothar Mountain
4356 Motley
4455 Mount Abundance
4310 Mount Alford
4680 Mount Alma
4514 Mount Archer
4701 Mount Archer
4287 Mount Barney
4313 Mount Beppo
4341 Mount Berryman
4455 Mount Bindango
4314 Mount Binga
4742 Mount Britton
4312 Mount Byron
4871 Mount Carbine
4702 Mount Chalmers
4741 Mount Charlton
4370 Mount Colliery
4804 Mount Coolon
4573 Mount Coolum
4066 Mount Coot-Tha
4165 Mount Cotton
4306 Mount Crosby
4353 Mount Darry
4625 Mount Debateable
4514 Mount Delaney
4309 Mount Edwards
4816 Mount Elliot
4357 Mount Emlyn
4472 Mount Enniskillen
4340 Mount Forbes
4850 Mount Fox
4310 Mount French
4705 Mount Gardiner
4872 Mount Garnet
4285 Mount Gipps
4520 Mount Glorious
4122 Mount Gravatt
4122 Mount Gravatt East
4312 Mount Hallen
4454 Mount Howe
4454 Mount Hutton
4401 Mount Irving
4825 Mount Isa
4825 Mount Isa City
4825 Mount Isa Dc
4825 Mount Isa East
4740 Mount Jukes
4800 Mount Julian
4807 Mount Kelly
4515 Mount Kilcoy
4350 Mount Kynoch
4695 Mount Larcom
4625 Mount Lawless
4287 Mount Lindesay
4350 Mount Lofty
4814 Mount Louisa
4818 Mount Low
4352 Mount Luke
4723 Mount Macarthur
4854 Mount Mackay
4674 Mount Maria
4800 Mount Marlow
4306 Mount Marrow
4362 Mount Marshall
4754 Mount Martin
4606 Mount McEuen
4521 Mount Mee
4550 Mount Mellum
4465 Mount Moffatt
4361 Mount Molar
4871 Mount Molloy
4714 Mount Morgan
4403 Mount Moriah
4340 Mount Mort
4892 Mount Mulgrave
4871 Mount Mulligan
4715 Mount Murchison
4211 Mount Nathan
4520 Mount Nebo
4074 Mount Ommaney
4741 Mount Ossa
4741 Mount Pelion
4671 Mount Perry
4869 Mount Peter
4521 Mount Pleasant
4740 Mount Pleasant
4800 Mount Pluto
4350 Mount Rascal
4802 Mount Rooper
4520 Mount Samson
4868 Mount Sheridan
4818 Mount St John
4314 Mount Stanley
4625 Mount Steadman
4811 Mount Stuart
4370 Mount Sturt
4871 Mount Surprise
4809 Mount Surround
4343 Mount Sylvia
4370 Mount Tabor
4311 Mount Tarampa
4677 Mount Tom
4380 Mount Tully
4356 Mount Tyson
4650 Mount Urah
4340 Mount Walker
4340 Mount Walker West
4207 Mount Warren Park
4347 Mount Whitestone
4804 Mount Wyatt
4355 Mountain Camp
4557 Mountain Creek
4718 Moura
4858 Mourilyan
4858 Mourilyan Harbour
4877 Mowbray
4405 Mowbullan
4574 Moy Pocket
4606 Mp Creek
4461 Muckadilla
4213 Mudgeeraba
4564 Mudjimba
4600 Mudlo
4306 Muirlea
4703 Mulambin
4703 Mulara
4401 Muldu
4630 Mulgildie
4341 Mulgowie
4807 Mulgrave
4670 Mullett Creek
4309 Munbilla
4740 Munbura
4872 Munderra
4812 Mundingburra
4860 Mundoo
4285 Mundoolun
4626 Mundowran
4626 Mundubbera
4718 Mungabunda
4467 Mungallala
4467 Mungallala South
4886 Mungalli
4650 Mungar
2406 Mungindi
4630 Mungungo
4671 Mungy
4352 Muniganeen
4570 Munna Creek
4854 Munro Plains
4125 Munruben
4172 Murarrie
4605 Murgon
4352 Murphys Creek
4814 Murray
4875 Murray Island
4854 Murray Upper
4370 Murrays Bridge
4854 Murrigal
4312 Murrumba
4503 Murrumba Downs
4470 Murweh
4816 Mutarnee
4872 Mutchilba
4307 Mutdapilly
4732 Muttaburra
4415 Myall Park
4800 Myrtlevale
4812 Mysterton
4570 Nahrunda
4560 Nambour
4560 Nambour Bc
4560 Nambour Dc
4615 Nanango
4405 Nandi
4722 Nandowrie
4416 Nangram
4407 Nangwee
4701 Nankin
4874 Nanum
4874 Napranum
4504 Narangba
4352 Narko
4111 Nathan
4211 Natural Bridge
4671 Nearum
4488 Nebine
4742 Nebo
4570 Neerdie
4819 Nelly Bay
4860 Nerada
4211 Nerang
4211 Nerang Dc
4213 Neranwood
4701 Nerimbera
4650 Netherby
4756 Netherdale
4614 Neumgna
4514 Neurum
4570 Neusa Vale
4361 Nevilton
4680 New Auckland
4124 New Beith
4303 New Chum
4005 New Farm
4858 New Harbourline
4876 New Mapoon
4671 New Moonta
4873 Newell
4804 Newlands
4051 Newmarket
4020 Newport
4006 Newstead
4305 Newtown
4350 Newtown
4860 Ngatjan
4830 Nicholson
4655 Nikenbah
4740 Nindaroo
4561 Ninderry
4285 Nindooinbah
4702 Nine Mile
4714 Nine Mile Creek
4511 Ningi
4551 Nirimba
4477 Nive
4856 No 4 Branch
4856 No 5 Branch
4859 No 6 Branch
4873 Noah
4360 Nobby
4218 Nobby Beach
4492 Noccundra
4816 Nome
4490 Noorama
4417 Noorindoo
4567 Noosa Heads
4565 Noosa North Shore
4566 Noosaville
4566 Noosaville Dc
4701 Norman Gardens
4170 Norman Park
4890 Normanton
4620 North Aramara
4561 North Arm
4304 North Booval
4356 North Branch
4370 North Branch
4494 North Bungunya
4570 North Deep Creek
4741 North Eton
4660 North Gregory
4305 North Ipswich
4660 North Isis
4885 North Johnstone
4509 North Lakes
4740 North Mackay
4352 North Maclagan
4280 North Maclean
4552 North Maleny
4183 North Stradbroke Island
4272 North Tamborine
4305 North Tivoli
4350 North Toowoomba
4810 North Ward
4013 Northgate
4871 Northhead
4350 Northlands
4670 Norville
4208 Norwell
4356 Norwin
4014 Nudgee
4014 Nudgee Beach
4314 Nukku
4211 Numinbah Valley
4012 Nundah
4380 Nundubbermere
4352 Nutgrove
4871 Nychum
4877 Oak Beach
4811 Oak Valley
4605 Oakdale
4741 Oakenden
4401 Oakey
4714 Oakey Creek
4650 Oakhurst
4600 Oakview
4670 Oakwood
4285 Oaky Creek
4417 Oberina
4574 Obi Obi
4309 Obum Obum
4521 Ocean View
4706 Ogmore
4613 Okeden
4626 Old Cooranga
4362 Old Talgai
4352 Oman Ama
4305 One Mile
4718 Oombabeer
4811 Oonoonba
4740 Ooralea
4735 Opalton
4455 Orallo
4715 Orange Creek
4455 Orange Hill
4581 Orchid Beach
4850 Orient
4722 Orion
4741 Orkabie
4208 Ormeau
4208 Ormeau Hills
4160 Ormiston
4806 Osborne
4313 Ottaba
4650 Owanyilla
4741 Owens Creek
4210 Oxenford
4742 Oxford
4075 Oxley
4674 Oyster Creek
4218 Pacific Fair
4659 Pacific Haven
4703 Pacific Heights
4564 Pacific Paradise
4211 Pacific Pines
4865 Packers Camp
4064 Paddington
4880 Paddys Green
4740 Paget
4287 Palen Creek
4374 Palgrave
4110 Pallara
4810 Pallarenda
4650 Pallas Street Maryborough
4221 Palm Beach
4879 Palm Cove
4800 Palm Grove
4816 Palm Island
4892 Palmer
4860 Palmerston
4352 Palmtree
4553 Palmview
4555 Palmwoods
4751 Palmyra
4816 Paluma
4352 Pampas
4216 Paradise Point
4701 Park Avenue
4125 Park Ridge
4125 Park Ridge South
4702 Parkhurst
4115 Parkinson
4560 Parklands
4417 Parknook
4825 Parkside
4214 Parkwood
4870 Parramatta Park
4575 Parrearra
4721 Pasha
4380 Passchendaele
4570 Paterson
4311 Patrick Estate
4800 Pauls Pocket
4519 Peachester
4850 Peacock Siding
4306 Peak Crossing
4721 Peak Vale
4352 Pechey
4184 Peel Island
4885 Peeramon
4415 Pelham
4413 Pelican
4551 Pelican Waters
4816 Pentland
4625 Penwhaupell
4352 Peranga
4573 Peregian Beach
4573 Peregian Springs
4352 Perseverance
4560 Perwillowen
4871 Petford
4502 Petrie
4000 Petrie Terrace
4702 Pheasant Creek
4626 Philpott
4655 Pialba
4428 Pickanjinnie
4819 Picnic Bay
4570 Pie Creek
4355 Pierces Creek
4380 Pikedale
4380 Pikes Creek
4625 Pile Gully
4650 Pilerwa
4361 Pilton
4812 Pimlico
4209 Pimpama
4615 Pimpimbudgee
4860 Pin Gin Hill
4568 Pinbarren
4798 Pindi Pindi
4670 Pine Creek
4416 Pine Hills
4306 Pine Mountain
4355 Pinelands
4754 Pinevale
4069 Pinjarra Hills
4702 Pink Lily
4008 Pinkenba
4741 Pinnacle
4815 Pinnacles
4825 Pioneer
4650 Pioneers Rest
4405 Pirrinuan
4356 Pittsworth
4825 Piturie
4343 Placid Hills
4355 Plainby
4341 Plainland
4741 Pleystowe
4702 Plum Tree
4573 Point Arkwright
4183 Point Lookout
4655 Point Vernon
4568 Pomona
4454 Pony Hills
4650 Poona
4821 Porcupine
4892 Pormpuraaw
4699 Port Alma
4700 Port Curtis
4877 Port Douglas
4178 Port Of Brisbane
4871 Portland Roads
4870 Portsmith
4875 Poruma Island
4352 Postmans Ridge
4352 Pozieres
4821 Prairie
4370 Pratten
4650 Prawle
4311 Prenzlau
4352 Preston
4800 Preston
4127 Priestdale
4350 Prince Henry Heights
4875 Prince Of Wales
4660 Promisedland
4800 Proserpine
4715 Prospect
4613 Proston
4069 Pullenvale
4357 Punchs Creek
4876 Punsand
4306 Purga
4356 Purrawunda
4218 Q Supercentre
4820 Queenton
4724 Quetta
4480 Quilpie
4403 Quinalow
4670 Qunaba
4740 Racecourse
4305 Raceview
4307 Radford
4697 Raglan
4810 Railway Estate
4581 Rainbow Beach
4358 Ramsay
4352 Rangemore
4806 Rangemore
4405 Ranges Bridge
4350 Rangeville
4817 Rangewood
4154 Ransome
4815 Rasmussen
4287 Rathdowney
4352 Ravensbourne
4888 Ravenshoe
4816 Ravenswood
4892 Ravensworth
4630 Rawbelle
4059 Red Hill
4413 Red Hill
4701 Red Hill Rockhampton
4892 Red River
4301 Redbank
4312 Redbank Creek
4301 Redbank Plains
4020 Redcliffe
4020 Redcliffe North
4467 Redford
4605 Redgate
4671 Redhill Farms
4165 Redland Bay
4870 Redlynch
4660 Redridge
4350 Redwood
4227 Reedy Creek
4552 Reesville
4341 Regency Downs
4118 Regents Park
4816 Reid River
4625 Reids Creek
4723 Retro
4702 Rewan
4718 Rhydding
4077 Richlands
4740 Richmond
4822 Richmond
4820 Richmond Hill
4702 Ridgelands
4563 Ridgewood
4311 Rifle Range
4565 Ringtail Creek
4343 Ringwood
4800 Riordanvale
4306 Ripley
4807 Rita Island
4655 River Heads
4680 River Ranch
4280 Riverbend
4074 Riverhills
4626 Riverleigh
4470 Riversleigh
4385 Riverton
4303 Riverview
4310 Roadvale
4109 Robertson
4226 Robina
4226 Robina Dc
4419 Roche Creek
4123 Rochedale
4123 Rochedale South
4700 Rockhampton
4700 Rockhampton City
4701 Rockhampton Dc
4700 Rockhampton Hospital
4854 Rockingham
4106 Rocklea
4106 Rocklea Dc
4344 Rockmount
4510 Rocksberg
4343 Rockside
4350 Rockville
4357 Rocky Creek
4873 Rocky Point
4874 Rocky Point
4701 Rockyview
4678 Rodds Bay
4370 Rodgers Creek
4702 Rolleston
4816 Rollingstone
4455 Roma
4871 Rookwood
4343 Ropeley
4401 Rosalie Plains
4674 Rosedale
4370 Rosehill
4740 Rosella
4560 Rosemount
4811 Roseneath
4370 Rosenthal Heights
4340 Rosevale
4340 Rosewood
4570 Ross Creek
4816 Ross River
4812 Rosslea
4703 Rosslyn
4702 Rossmoya
4356 Rossvale
4895 Rossville
4022 Rothwell
4677 Round Hill
4718 Roundstone
4810 Rowes Bay
4515 Royston
4670 Rubyanna
4702 Rubyvale
4674 Rules Beach
4216 Runaway Bay
4113 Runcorn
4849 Rungoo
4287 Running Creek
4615 Runnymede
4740 Rural View
4521 Rush Creek
4184 Russell Island
4825 Ryan
4361 Ryeford
4413 Rywung
4401 Sabine
4305 Sadliers Crossing
4875 Saibai Island
4107 Salisbury
4107 Salisbury East
4520 Samford
4520 Samford Valley
4520 Samford Village
4520 Samsonvale
4212 Sanctuary Cove
4017 Sandgate
4017 Sandgate Dc
4740 Sandiford
4701 Sandringham
4511 Sandstone Point
4361 Sandy Camp
4515 Sandy Creek
4871 Sandy Pocket
4615 Sandy Ridges
4702 Sapphire Central
4275 Sarabah
4737 Sarina
4737 Sarina Beach
4737 Sarina Range
4818 Saunders Beach
4816 Savannah
4822 Saxby
4020 Scarborough
4655 Scarness
4570 Scotchy Pocket
4804 Scottville
4313 Scrub Creek
4478 Scrubby Creek
4570 Scrubby Creek
4356 Scrubby Mountain
4741 Seaforth
4876 Seisia
4630 Selene
4816 Sellheim
4824 Selwyn
4754 Septimus
4170 Seven Hills
4344 Seventeen Mile
4073 Seventeen Mile Rocks
4677 Seventeen Seventy
4820 Seventy Mile
4380 Severnlea
4570 Sexton
4128 Shailer Park
4873 Shannonvale
4670 Sharon
4818 Shaw
4515 Sheep Station Creek
4874 Shelburne
4157 Sheldon
4855 Shell Pocket
4551 Shelly Beach
4810 Shelly Beach
4075 Sherwood
4809 Shirbourne
4750 Shoal Point
4702 Shoalwater
4017 Shorncliffe
4802 Shute Harbour
4304 Silkstone
4856 Silkwood
4854 Silky Oak
4800 Silver Creek
4352 Silver Ridge
4385 Silver Spur
4872 Silver Valley
4124 Silverbark Ridge
4307 Silverdale
4605 Silverleaf
4401 Silverleigh
4370 Silverwood
4454 Simmie
4073 Sinnamon Park
4556 Sippy Downs
4671 Skyring Reserve
4127 Slacks Creek
4740 Slade Point
4370 Sladevale
4878 Smithfield
4385 Smithlea
4825 Soldiers Hill
4876 Somerset
4312 Somerset Dam
4470 Sommariva
4382 Somme
4670 South Bingera
4101 South Brisbane
4101 South Brisbane Bc
4615 South East Nanango
4680 South End
4680 South Gladstone
4860 South Innisfail
4660 South Isis
4859 South Johnstone
4670 South Kolan
4740 South Mackay
4280 South Maclean
4852 South Mission Beach
4615 South Nanango
4306 South Ripley
4216 South Stradbroke
4350 South Toowoomba
4810 South Townsville
4680 South Trees
4892 South Wellesley Islands
4702 South Yaamba
4363 Southbrook
4871 Southedge
4820 Southern Cross
4211 Southern Lamington
4215 Southport
4215 Southport Bc
4215 Southport Park
4570 Southside
4406 Southwood
4613 Speedwell
4881 Speewah
4630 Splinter Creek
4306 Split Yard Creek
4825 Spreadborough
4352 Spring Bluff
4343 Spring Creek
4361 Spring Creek
4420 Spring Creek
4000 Spring Hill
4300 Spring Mountain
4213 Springbrook
4380 Springdale
4300 Springfield
4871 Springfield
4300 Springfield Central
4300 Springfield Lakes
4804 Springlands
4356 Springside
4722 Springsure
4405 Springvale
4127 Springwood
4873 Spurgeon
4671 St Agnes
4352 St Aubyn
4487 St George
4356 St Helens
4650 St Helens
4798 St Helens Beach
4671 St Kilda
4707 St Lawrence
4067 St Lucia
4067 St Lucia South
4650 St Mary
4405 St Ruth
4892 Staaten
4053 Stafford
4053 Stafford Dc
4053 Stafford Heights
4613 Stalworth
4821 Stamford
4702 Stanage
4514 Stanmore
4380 Stanthorpe
4702 Stanwell
4207 Stapylton
4895 Starcke
4207 Steiglitz
4875 Stephens Island
4873 Stewart Creek Valley
4702 Stewarton
4625 Stockhaven
4280 Stockleigh
4871 Stockton
4344 Stockyard
4703 Stockyard
4823 Stokes
4357 Stonehenge
4730 Stonehenge
4612 Stonelands
4356 Stoneleigh
4120 Stones Corner
4514 Stony Creek
4380 Storm King
4860 Stoters Hill
4870 Stratford
4800 Strathdickie
4742 Strathfield
4871 Strathmore
4500 Strathpine
4500 Strathpine Centre
4116 Stretton
4714 Struck Oil
4811 Stuart
4829 Sturt
4380 Sugarloaf
4800 Sugarloaf
4413 Sujeewong
4341 Summerholm
4074 Sumner
4074 Sumner Park Bc
4680 Sun Valley
4382 Sundown
4860 Sundown
4605 Sunny Nook
4109 Sunnybank
4109 Sunnybank Hills
4109 Sunnybank South
4737 Sunnyside
4567 Sunrise Beach
4825 Sunset
4655 Sunshine Acres
4567 Sunshine Beach
4560 Sunshine Coast Mc
4558 Sunshine Plaza
4417 Surat
4217 Surfers Paradise
4655 Susan River
4743 Suttor
4670 Svensson Heights
4370 Swan Creek
4306 Swanbank
4371 Swanfels
4807 Swans Lagoon
4873 Syndicate
4610 Taabinga
4605 Tablelands
4680 Tablelands
4285 Tabooba
4285 Tabragalba
4018 Taigum
4671 Takilberan
4655 Takura
4871 Talaroo
4823 Taldora
4650 Talegalla Weir
4362 Talgai
4213 Tallai
4228 Tallebudgera
4228 Tallebudgera Valley
4340 Tallegalla
4496 Talwood
4570 Tamaree
4478 Tambo
4270 Tamborine
4272 Tamborine Mountain
4285 Tamrookum
4285 Tamrookum Creek
4128 Tanah Merah
4556 Tanawha
4481 Tanbar
4703 Tanby
4650 Tandora
4570 Tandur
4025 Tangalooma
4821 Tangorin
4680 Tannum Sands
4372 Tannymorel
4601 Tansey
4421 Tara
4680 Taragoola
4311 Tarampa
4703 Taranganba
4494 Tarawera
4694 Targinnie
4068 Taringa
4309 Tarome
4314 Taromeo
4615 Tarong
4420 Taroom
4703 Taroomball
4121 Tarragindi
4702 Tarramba
4885 Tarzali
4674 Taunton
4850 Taylors Beach
4740 Te Kowai
4650 Teddington
4620 Teebar
4314 Teelah
4423 Teelba
4680 Telina
4630 Tellebang
4310 Templin
4005 Teneriffe
4105 Tennyson
4387 Terrica
4309 Teviotville
4565 Tewantin
4385 Texas
4670 Thabeban
4306 Thagoona
4497 Thallon
4370 Thane
4370 Thanes Creek
4716 Thangool
4492 Thargomindah
4340 The Bluff
4355 The Bluff
4702 The Caves
4701 The Common
4570 The Dawn
4650 The Dimonds
4373 The Falls
4061 The Gap
4825 The Gap
4370 The Glen
4406 The Gums
4373 The Head
4370 The Hermitage
4700 The Keppels
4740 The Leap
4625 The Limits
4714 The Mine
4695 The Narrows
4570 The Palms
4707 The Percy Group
4357 The Pines
4700 The Range
4377 The Summit
4570 Theebine
4719 Theodore
4721 Theresa Creek
4650 Thinoomba
4702 Thompson Point
4800 Thoopara
4871 Thornborough
4380 Thorndale
4158 Thorneside
4164 Thornlands
4341 Thornton
4873 Thornton Beach
4352 Thornville
4630 Three Moon
4824 Three Rivers
4376 Thulimbah
4817 Thuringowa Central
4814 Thuringowa Dc
4875 Thursday Island
4650 Tiaro
4709 Tieri
4580 Tin Can Bay
4650 Tinana
4650 Tinana South
4872 Tinaroo
4563 Tinbeerwah
4173 Tingalpa
4173 Tingalpa Dc
4608 Tingoora
4455 Tingun
4650 Tinnanbar
4405 Tipton
4671 Tirroan
4305 Tivoli
4702 Togara
4829 Toko
4882 Tolga
4820 Toll
4850 Toobanna
4498 Toobeah
4313 Toogoolawah
4655 Toogoom
4818 Toolakea
4570 Toolara Forest
4370 Toolburra
4680 Toolooa
4816 Toomulla
4625 Toondahra
4816 Toonpan
4510 Toorbul
4066 Toowong
4066 Toowong Bc
4066 Toowong Dc
4350 Toowoomba
4350 Toowoomba City
4350 Toowoomba Dc
4350 Toowoomba East
4352 Toowoomba Mc
4350 Toowoomba South
4350 Toowoomba Village Fair
4350 Toowoomba West
4350 Top Camp
4885 Topaz
4662 Torbanlea
4655 Torquay
4816 Torrens Creek
4350 Torrington
4560 Towen Mountain
4820 Towers Hill
4810 Town Common
4341 Townson
4810 Townsville
4810 Townsville City
4810 Townsville Dc
4810 Townsville Mc
4825 Townview
4570 Traveston
4850 Trebonne
4370 Tregony
4879 Trinity Beach
4879 Trinity Park
4714 Trotter Creek
4874 Trunding
4650 Tuan
4650 Tuan Forest
4570 Tuchekoi
4411 Tuckerang
4490 Tuen
4224 Tugun
4854 Tully
4854 Tully Heads
4352 Tummaville
4888 Tumoulin
4702 Tungamull
4357 Turallin
4678 Turkey Beach
4742 Turrawulla
4564 Twin Waters
4570 Two Mile
4467 Tyrconnel
4680 Ubobo
4875 Ugar Island
4702 Ulogie
4876 Umagico
4352 Umbiram
4119 Underwood
4285 Undullah
4883 Upper Barron
4069 Upper Brookfield
4510 Upper Caboolture
4209 Upper Coomera
4402 Upper Cooyar Creek
4873 Upper Daintree
4860 Upper Daradgee
4454 Upper Dawson
4344 Upper Flagstone
4370 Upper Freestone
4570 Upper Glastonbury
4809 Upper Haughton
4570 Upper Kandanga
4055 Upper Kedron
4352 Upper Lockyer
4122 Upper Mount Gravatt
4122 Upper Mount Gravatt Bc
4361 Upper Pilton
4355 Upper Pinelands
4850 Upper Stone
4343 Upper Tenthill
4477 Upper Warrego
4370 Upper Wheatvale
4614 Upper Yarraman
4655 Urangan
4655 Urraween
4871 Utchee Creek
4465 V Gate
4561 Valdora
4352 Vale View
4715 Valentine Plains
4742 Valkyrie
4850 Valley Of Lagoons
4227 Varsity Lakes
4860 Vasa Views
4630 Ventnor
4347 Veradilla
4285 Veresdale
4285 Veresdale Scrub
4306 Vernor
4562 Verrierdale
4570 Veteran
4361 Victoria Hill
4751 Victoria Plains
4850 Victoria Plantation
4165 Victoria Point
4165 Victoria Point West
4822 Victoria Vale
4570 Victory Heights
4514 Villeneuve
4814 Vincent
4343 Vinegar Hill
4014 Virginia
4014 Virginia Bc
4014 Virginia Dc
4076 Wacol
4513 Wagtail Grove
4625 Wahoon
4420 Waikola
4404 Wainui
4872 Wairuna
4154 Wakerley
4462 Walhallow
4872 Walkamin
4650 Walkers Point
4751 Walkerston
4670 Walkervale
4310 Wallaces Creek
4850 Wallaman
4383 Wallangarra
4702 Wallaroo
4671 Wallaville
4655 Walliebum
4655 Walligan
4306 Walloon
4570 Wallu
4428 Wallumbilla
4428 Wallumbilla North
4428 Wallumbilla South
4714 Walmul
4854 Walter Hill
4856 Walter Lever Estate
4714 Walterhall
4512 Wamuran
4512 Wamuran Basin
4700 Wandal
4419 Wandoan
4871 Wangan
4806 Wangaratta
4877 Wangetti
4860 Wanjuru
4306 Wanora
4513 Waraba
4575 Warana
4823 Warburton
4470 Ward
4829 Warenda
4417 Warkon
4500 Warner
4718 Warnoah
4605 Warnung
4411 Warra
4875 Warraber Islet
4854 Warrami
4307 Warrill View
4387 Warroo
4871 Warrubullen
4370 Warwick
4370 Warwick Dc
4306 Washpool
4670 Watalgan
4621 Wateranga
4133 Waterford
4133 Waterford West
4673 Waterloo
4385 Watsons Crossing
4887 Watsonville
4615 Wattle Camp
4610 Wattle Grove
4357 Wattle Ridge
4704 Wattlebank
4875 Waua Islet
4871 Waugh Pocket
4012 Wavell Heights
4012 Wavell Heights North
4825 Waverley
4722 Wealwandangie
4860 Webb
4497 Weengallon
4703 Weerriba
4874 Weipa
4874 Weipa Airport
4406 Weir River
4670 Welcome Creek
4350 Wellcamp
4121 Wellers Hill
4417 Wellesley
4892 Wellesley Islands
4160 Wellington Point
4507 Welsby
4615 Wengenville
4874 Wenlock
4405 Weranga
4417 Weribone
4101 West End
4810 West End
4680 West Gladstone
4359 West Haldon
4305 West Ipswich
4740 West Mackay
4819 West Point
4403 West Prairie
4700 West Rockhampton
4680 West Stowe
4892 West Wellesley Islands
4559 West Woombye
4350 Westbrook
4870 Westcourt
4357 Western Creek
4454 Westgrove
4074 Westlake
4422 Westmar
4514 Westvale
4702 Westwood
4625 Wetheron
4562 Weyba Downs
4850 Wharps
4606 Wheatlands
4370 Wheatvale
4387 Whetstone
4352 Whichello
4352 White Mountain
4507 White Patch
4306 White Rock
4868 White Rock
4503 Whiteside
4870 Whitfield
4802 Whitsundays
4873 Whyanbeel
4570 Widgee
4570 Widgee Crossing North
4570 Widgee Crossing South
4490 Widgeegoara
4413 Wieambilla
4520 Wights Mountain
4612 Wigton
4370 Wildash
4608 Wilkesdale
4110 Willawong
4209 Willow Vale
4306 Willowbank
4702 Willows
4702 Willows Gemfields
4370 Willowvale
4829 Wills
4800 Wilson Beach
4625 Wilson Valley
4307 Wilsons Plains
4570 Wilsons Pocket
4350 Wilsonton
4350 Wilsonton Heights
4051 Wilston
4721 Winchester
4207 Windaroo
4605 Windera
4670 Windermere
4478 Windeyer
4481 Windorah
4030 Windsor
4670 Winfield
4825 Winston
4735 Winton
4347 Winwill
4515 Winya
4122 Wishart
4352 Withcott
4275 Witheren
4552 Witta
4311 Wivenhoe Hill
4306 Wivenhoe Pocket
4370 Wiyarra
4419 Woleebee
4721 Wolfang
4207 Wolffdene
4570 Wolvi
4465 Womalilla
4465 Womblebank
4370 Womina
4671 Wonbah
4671 Wonbah Forest
4606 Wondai
4390 Wondalli
4887 Wondecla
4655 Wondunna
4873 Wonga Beach
4883 Wongabel
4852 Wongaling Beach
4210 Wongawallan
4275 Wonglepong
4620 Woocoo
4343 Woodbine
4703 Woodbury
4305 Woodend
4680 Wooderson
4514 Woodford
4660 Woodgate
4285 Woodhill
4343 Woodlands
4352 Woodleigh
4625 Woodmillar
4114 Woodridge
4816 Woodstock
4802 Woodwark
4019 Woody Point
4702 Woolein
4822 Woolgar
4102 Woolloongabba
4515 Woolmar
4352 Woolmer
4570 Woolooga
4310 Woolooman
4030 Wooloowin
4340 Woolshed
4559 Woombye
4357 Woondul
4570 Woondum
4670 Woongarra
4207 Woongoolba
4871 Woopen Creek
4713 Woorabinda
4507 Woorim
4608 Wooroolin
4702 Wooroona
4605 Wooroonden
4860 Wooroonooran
4552 Wootha
4621 Woowoonga
4868 Woree
4213 Worongary
4702 Wowan
4601 Wrattens Forest
4869 Wrights Creek
4892 Wrotham
4895 Wujal Wujal
4811 Wulguru
4305 Wulkuraka
4806 Wunjunga
4714 Wura
4680 Wurdong Heights
4575 Wurtulla
4627 Wuruma Dam
4352 Wutul
4390 Wyaga
4615 Wyalla
4350 Wyalla Plaza
4489 Wyandra
4310 Wyaralong
4382 Wyberba
4702 Wycarbah
4412 Wychie
4455 Wycombe
4178 Wynnum
4178 Wynnum North
4178 Wynnum Plaza
4178 Wynnum West
4352 Wyreema
4723 Wyuna
4704 Yaamba
4818 Yabulu
4390 Yagaburne
4892 Yagoonya
4352 Yalangur
4741 Yalboroo
4875 Yam Island
4720 Yamala
4305 Yamanto
4673 Yandaran
4478 Yandarlo
4352 Yandilla
4561 Yandina
4561 Yandina Creek
4371 Yangan
4731 Yaraka
4401 Yargullen
4573 Yaroomba
4871 Yarrabah
4207 Yarrabilba
4892 Yarraden
4614 Yarraman
4356 Yarranlea
4630 Yarrol
4694 Yarwun
4207 Yatala
4207 Yatala Dc
4105 Yeerongpilly
4388 Yelarbon
4625 Yenda
4650 Yengarie
4703 Yeppoon
4104 Yeronga
4650 Yerra
4313 Yimbun
4875 Yorke Island
4878 Yorkeys Knob
4490 Yowah
4520 Yugar
4416 Yulabilla
4427 Yuleba
4427 Yuleba North
4427 Yuleba South
4884 Yungaburra
4850 Yuruga
4034 Zillmere
4710 Zilzie`;

const SA = `5159 Aberfoyle Park
5440 Abminga Station
5000 Adelaide
5950 Adelaide Airport
5000 Adelaide Bc
5558 Agery
5311 Alawoona
5014 Albert Park
5014 Alberton
5154 Aldgate
5173 Aldinga
5173 Aldinga Beach
5555 Alford
5723 Allandale Station
5009 Allenby Gardens
5291 Allendale East
5373 Allendale North
5401 Alma
5730 Alpana
5733 Alton Downs Station
5351 Altona
0872 Amata
5222 American Beach
5221 American River
5431 Amyton
5464 Anama
0872 Anangu Pitjantjatjara Yankunytjatjara
5722 Andamooka
5722 Andamooka Station
5454 Andrews
5114 Andrews Farm
5255 Angas Plains
5238 Angas Valley
5353 Angaston
5732 Angepena
5010 Angle Park
5117 Angle Vale
5730 Angorigina
5723 Anna Creek
5356 Annadale
5222 Antechamber Bay
5237 Apamurra
5413 Apoinga
5480 Appila
5723 Arckaringa
5720 Arcoona
5571 Ardrossan
5732 Arkaroola
5701 Arkaroola Village
5453 Armagh
5603 Arno Bay
5572 Arthurton
5043 Ascot Park
5157 Ashbourne
5035 Ashford
5137 Ashton
5259 Ashville
5076 Athelstone
5012 Athol Park
5451 Auburn
5072 Auldana
5374 Australia Plains
5273 Avenue Range
5253 Avoca Dell
5501 Avon
0872 Ayers Range South
5211 Back Valley
5601 Backy Point
5373 Bagot Well
5671 Baird Bay
5354 Bakara
5354 Bakara Well
5417 Balah
5461 Balaklava
5203 Bald Hills
5417 Baldina
5573 Balgowan
5242 Balhannah
5221 Ballast Head
5268 Bangham
5481 Bangor
5091 Banksia Park
5460 Barabba
5432 Baratta
5453 Barinia
5345 Barmera
5641 Barna
5434 Barndioota
5495 Baroota
5351 Barossa Goldfields
5520 Barunga Gap
5138 Basket Range
5222 Baudin Beach
5223 Bay Of Shoals
5280 Beachport
5320 Beatty
5550 Beaufort
5066 Beaumont
5320 Beaumonts
5042 Bedford Park
5523 Beetaloo Valley
5052 Belair
5491 Belalie East
5491 Belalie North
5050 Bellevue Heights
5730 Beltana
5730 Beltana Station
5432 Belton
5255 Belvidere
5453 Benbournie
5440 Benda
5343 Berri
5352 Bethany
5373 Bethel
5067 Beulah Park
5009 Beverley
5118 Bibaringa
5432 Bibliando
5238 Big Bend
5153 Biggs Flat
5720 Billa Kalina
5440 Billeroo West
5311 Billiatt
5440 Bimbowrie
5440 Bindarrah
5262 Binnum
5223 Birchmore
5234 Birdwood
5015 Birkenhead
5035 Black Forest
5353 Black Hill
5434 Black Hill Station
5571 Black Point
5431 Black Rock
5413 Black Springs
5291 Blackfellows Caves
5201 Blackfellows Creek
5275 Blackford
5051 Blackwood
5084 Blair Athol
5114 Blakeview
5250 Blakiston
5700 Blanche Harbor
5357 Blanchetown
5255 Bletchley
5171 Blewitt Springs
5730 Blinman
5575 Bluff Beach
5462 Blyth
5275 Boatswain Point
5655 Bockelberg
5453 Boconnoc Park
5110 Bolivar
5731 Bollards Lagoon
5238 Bolto
5719 Bon Bon
5417 Booborowie
5690 Bookabie
5333 Bookpurnong
5271 Bool Lagoon
5440 Boolcoomatta
5482 Booleroo Centre
5330 Boolgun
5633 Boonerdo
5554 Boors Plain
5268 Bordertown
5268 Bordertown South
5309 Borrika
5607 Boston
5720 Bosworth
5007 Bowden
5374 Bower
5238 Bowhill
5461 Bowillia
5550 Bowmans
5153 Bradbury
5381 Brady Creek
5109 Brahma Lodge
5670 Bramfield
5276 Bray
5320 Brenda Park
5575 Brentwood
5155 Bridgewater
5381 Bright
5048 Brighton
5267 Brimbago
5253 Brinkley
5464 Brinkworth
5083 Broadview
5007 Brompton
5607 Brooker
5032 Brooklyn Park
5454 Broughton River Valley
5222 Brown Beach
5062 Brown Hill Creek
5374 Brownlow
5223 Brownlow Ki
5433 Bruce
5252 Brukunga
5374 Buchanan
5118 Buchfelde
5270 Buckingham
5120 Buckland Park
5641 Buckleboo
5311 Bugle Hut
5251 Bugle Ranges
5719 Bulgunnia
5157 Bull Creek
5440 Bulloo Creek
5520 Bumbunga
5266 Bunbury
5491 Bundaleer Gardens
5491 Bundaleer North
5320 Bundey
5540 Bungama
5464 Bungaree
5641 Bungeroo
5417 Bunyung
5253 Burdett
5520 Burnsfield
5066 Burnside
5732 Burr Well
5417 Burra
5417 Burra Eastern Districts
5291 Burrungule
5110 Burton
5560 Bute
5605 Butler
5321 Cadell
5321 Cadell Lagoon
5271 Cadgee
5671 Calca
5310 Caliph
5733 Callanna
5254 Callington
5501 Calomba
5254 Caloote
5341 Calperum Station
5490 Caltowie
5490 Caltowie North
5490 Caltowie West
5353 Cambrai
5038 Camden Park
5074 Campbelltown
5640 Campoona
5417 Canegrass
5268 Cannawigara
5419 Canowie
5420 Canowie Belt
5280 Canunda
5223 Cape Borda
5291 Cape Douglas
5275 Cape Jaffa
5204 Cape Jervis
5641 Caralue
5680 Carawa
5301 Carcuma
5270 Carew
5144 Carey Gully
5291 Caroline
5291 Carpenter Rocks
5204 Carrickalinga
5432 Carrieton
5715 Carriewerloo
5223 Cassini
5076 Castambul
5238 Caurnamont
5094 Cavan
5422 Cavenagh
5291 Caveton
5690 Ceduna
5690 Ceduna Waters
5341 Chaffey
5231 Chain Of Ponds
5680 Chandada
5159 Chandlers Hill
5153 Chapel Hill
5253 Chapman Bore
5244 Charleston
5607 Charlton Gully
5690 Charra
5014 Cheltenham
5157 Cherry Gardens
5134 Cherryville
5660 Chilpenunda
5573 Chinaman Wells
5680 Chinbingina
5211 Chiton
5341 Chowilla
5164 Christie Downs
5165 Christies Beach
5165 Christies Beach North
5690 Chundaria
5000 City West Campus
5062 Clapham
5453 Clare
5039 Clarence Gardens
5034 Clarence Park
5157 Clarendon
5280 Clay Wells
5238 Claypans
5256 Clayton Bay
5733 Clayton Station
5085 Clearview
5152 Cleland
5523 Clements Gap
5640 Cleve
5733 Clifton Hills Station
5570 Clinton
5570 Clinton Centre
5042 Clovelly Park
5346 Cobdogla
5654 Cocata
5631 Cockaleechie
5351 Cockatoo Valley
5440 Cockburn
5607 Coffin Bay
5266 Colebatch
5272 Coles
5069 College Park
5671 Colley
5555 Collinsfield
5418 Collinsville
5081 Collinswood
5041 Colonel Light Gardens
5670 Colton
5277 Comaum
5700 Commissariat Point
5719 Commonwealth Hill
5291 Compton
5118 Concordia
5464 Condowie
5272 Conmurra
5723 Coober Pedy
5583 Coobowie
5701 Cook
5261 Cooke Plains
5670 Coolillie
5341 Cooltong
5261 Coomandook
5267 Coombe
5431 Coomooroo
5607 Coomunga
5265 Coonalpyn
5540 Coonamia
5263 Coonawarra
5719 Coondambo
5690 Coorabie
5264 Coorong
5650 Cootra
5611 Cooyerdoo
5308 Copeville
5732 Copley
5731 Cordillo Downs
5575 Corny Point
5157 Coromandel East
5051 Coromandel Valley
5641 Cortlinye
5611 Corunna Station
5577 Couch Beach
5607 Coulta
5033 Cowandilla
5733 Cowarie
5602 Cowell
5238 Cowirra
5609 Cowleds Landing
5432 Cradock
5152 Crafers
5152 Crafers West
5051 Craigburn Farm
5114 Craigmore
5341 Crescent
5235 Cromer
5558 Cross Roads
5734 Crown Point
5008 Croydon
5008 Croydon Park
5523 Crystal Brook
5232 Cudlee Creek
5261 Culburra
5700 Cultana
5041 Cumberland Park
5631 Cummins
5660 Cungena
5554 Cunliffe
5571 Cunningham
5641 Cunyarie
5440 Curnamona
5580 Curramulka
5214 Currency Creek
5269 Custon
5222 Cuttlefish Bay
5223 Cygnet River
5461 Dalkey
5417 Danggali
5642 Darke Peak
5047 Darlington
5700 Davenport
5355 Daveyston
5113 Davoren Park
5113 Davoren Park South
5041 Daw Park
5252 Dawesley
5422 Dawson
5223 De Mole River
0872 De Rose Hill
5204 Deep Creek
5266 Deepwater
5204 Delamere
5690 Denial Bay
5075 Dernancourt
5330 Devlins Pound
5008 Devon Park
5440 Devonborough Downs
5172 Dingabledinga
5110 Direk
5291 Dismal Swamp
5291 Donovans
5157 Dorset Vale
5601 Douglas Point
5601 Douglas Point South
5048 Dover Gardens
5571 Dowlingville
5094 Dry Creek
5501 Dublin
5607 Duck Ponds
5222 Dudley East
5008 Dudley Park
5222 Dudley West
5733 Dulkaninna
5065 Dulwich
5223 Duncan
5356 Dutton
5356 Dutton East
5558 East Moonta
5063 Eastwood
5320 Eba
5680 Eba Anchorage
5355 Ebenezer
5153 Echunga
5050 Eden Hills
5235 Eden Valley
5730 Ediacara
5630 Edillilie
5111 Edinburgh
5113 Edinburgh North
5111 Edinburgh Raaf
5583 Edithburgh
5039 Edwardstown
5291 Eight Mile Creek
5112 Elizabeth
5113 Elizabeth Downs
5112 Elizabeth East
5112 Elizabeth Grove
5113 Elizabeth North
5113 Elizabeth Park
5112 Elizabeth South
5112 Elizabeth Vale
5670 Elliston
5260 Elwomple
5713 Emeroo
5223 Emu Bay
5381 Emu Downs
5453 Emu Flat
5211 Encounter Bay
5085 Enfield
5085 Enfield Plaza
5066 Erindale
5734 Eringa
5461 Erith
0872 Ernabella (pukatja)
5422 Erskine
5440 Erudina
5733 Etadunna
5015 Ethelton
5253 Ettrick
5374 Eudunda
5431 Eurelia
5454 Euromina
5069 Evandale
5116 Evanston
5116 Evanston Gardens
5116 Evanston Park
5116 Evanston South
5723 Evelyn Downs
5461 Everard Central
5035 Everard Park
5019 Exeter
5950 Export Park
5121 Eyre
5126 Fairview Park
5601 False Bay
5417 Faraway Hill
5731 Farina
5731 Farina Station
5607 Farm Beach
5416 Farrell Flat
5070 Felixstow
5010 Ferryden Park
5265 Field
5023 Findon
5255 Finniss
5070 Firle
5502 Fischer
5354 Fisher
5522 Fisherman Bay
5601 Fitzgerald Bay
5082 Fitzroy
5238 Five Miles
5159 Flagstaff Hill
5153 Flaxley
5235 Flaxman Valley
5223 Flinders Chase
5025 Flinders Park
5434 Flinders Ranges
5042 Flinders University
5440 Florina Station
5373 Fords
5139 Forest Range
5035 Forestville
5233 Forreston
5238 Forster
5577 Foul Bay
5607 Fountain
5690 Fowlers Bay
5272 Fox
5238 Frahns
5262 Frances
5421 Franklyn
5374 Frankton
5238 Frayville
5372 Freeling
5063 Frewville
5440 Frome Downs
5024 Fulham
5024 Fulham Gardens
5063 Fullarton
5280 Furner
5308 Galga
5732 Gammon Ranges
5015 Garden Island
5118 Gawler
5118 Gawler Belt
5118 Gawler East
5655 Gawler Ranges
5118 Gawler River
5118 Gawler South
5118 Gawler West
5255 Gemmells
5472 Georgetown
5094 Gepps Cross
5301 Geranium
5381 Geranium Plains
5343 Gerard
5291 German Creek
5280 German Flat
5495 Germein Bay
5731 Gidgealpa
5253 Gifford Hill
5081 Gilberton
5411 Giles Corner
5453 Gillentown
5611 Gilles Downs
5086 Gilles Plains
5013 Gillman
5473 Gladstone
5037 Glandore
5015 Glanville
5064 Glen Osmond
5052 Glenalta
5291 Glenburnie
5291 Glencoe
5719 Glendambo
5045 Glenelg
5045 Glenelg East
5045 Glenelg North
5045 Glenelg South
5044 Glengowrie
5277 Glenroy
5065 Glenside
5064 Glenunga
5110 Globe Derby Park
5344 Glossop
5417 Gluepot
5070 Glynde
5070 Glynde Plaza
5125 Golden Grove
5125 Golden Grove Village
5322 Golden Heights
5352 Gomersal
5330 Good Hope Landing
5034 Goodwood
5214 Goolwa
5214 Goolwa Beach
5214 Goolwa North
5214 Goolwa South
5223 Gosse
5114 Gould Creek
5461 Goyder
5502 Grace Plains
5440 Grampus
5022 Grange
5107 Green Fields
5153 Green Hills Range
5607 Green Patch
5086 Greenacres
5253 Greenbanks
5140 Greenhill
5360 Greenock
5272 Greenways
5125 Greenwith
5096 Gulfview Heights
5471 Gulnare
5417 Gum Creek
5730 Gum Creek Station
5233 Gumeracha
5343 Gurra Gurra
5163 Hackham
5163 Hackham West
5454 Hacklins Corner
5069 Hackney
5245 Hahndorf
5223 Haines
5461 Halbury
5309 Halidon
5000 Halifax Street
5381 Hallelujah Hills
5419 Hallett
5158 Hallett Cove
5642 Hambidge
5373 Hamilton
5558 Hamley
5401 Hamley Bridge
5431 Hammond
5374 Hampden
5086 Hampstead Gardens
5374 Hansborough
5417 Hanson
5159 Happy Valley
5575 Hardwicke Bay
5422 Hardy
5244 Harrogate
5464 Hart
5255 Hartley
5680 Haslam
5280 Hatherleigh
5434 Hawker
5330 Hawks Nest Station
5607 Hawson
5062 Hawthorn
5051 Hawthorndene
5204 Hay Flat
5252 Hay Valley
5211 Hayborough
5066 Hazelwood Park
5153 Heathfield
5068 Heathpool
5073 Hectorville
5014 Hendon
5022 Henley Beach
5022 Henley Beach South
5118 Hewett
5089 Highbury
5063 Highgate
5255 Highland Valley
5453 Hill River
5112 Hillbank
5086 Hillcrest
5116 Hillier
5455 Hilltown
5717 Hiltaba
5033 Hilton
5033 Hilton Plaza
5603 Hincks
5007 Hindmarsh
5214 Hindmarsh Island
5202 Hindmarsh Tiers
5211 Hindmarsh Valley
5088 Holden Hill
5330 Holder
5330 Holder Siding
5432 Holowiliena
5432 Holowiliena South
5576 Honiton
5172 Hope Forest
5555 Hope Gap
5090 Hope Valley
5491 Hornsdale
5141 Horsnell Gully
5461 Hoskin Corner
5131 Houghton
5048 Hove
5453 Hoyleton
5523 Huddleston
5114 Humbug Scrub
5163 Huntfield Heights
5061 Hyde Park
5262 Hynam
5715 Illeroo
0872 Indulkana (iwantja)
5098 Ingle Farm
5133 Inglewood
5723 Ingomar
5550 Inkerman
5680 Inkster
5211 Inman Valley
5731 Innamincka
5577 Inneston
5611 Iron Baron
5611 Iron Knob
5153 Ironbank
5222 Ironstone
5222 Island Beach
5713 Island Lagoon
0872 Iwantja
5301 Jabuk
5571 James Well
5491 Jamestown
5640 Jamieson
5554 Jericho
5554 Jerusalem
5259 Jervois
5271 Joanna
5431 Johnburgh
5070 Joslin
5238 Julanka Holdings
5374 Julia
5153 Jupiter Creek
5554 Kadina
5552 Kainton
5440 Kalabity
5733 Kalamurina
5690 Kalanbi
5278 Kalangadoo
5118 Kalbeeba
5655 Kaldoonera
0872 Kalka
5440 Kalkaroo
5550 Kallora
0872 Kaltjiti
5157 Kangarilla
5118 Kangaroo Flat
5222 Kangaroo Head
5280 Kangaroo Inn
5252 Kanmantoo
5330 Kanni
0872 Kanpi
5434 Kanyaka
5632 Kapinnie
5670 Kappawanta
5373 Kapunda
5223 Karatta
5654 Karcultaby
5632 Karkoo
5307 Karoonda
5304 Karte
5343 Katarapko
5611 Katunga Station
5275 Keilira
5267 Keith
5607 Kellidie Bay
5641 Kelly
5068 Kensington
5068 Kensington Gardens
5068 Kensington Park
5067 Kent Town
5233 Kenton Valley
5259 Kepa
5271 Keppoch
5231 Kersbrook
5035 Keswick
5035 Keswick Terminal
5353 Keyneton
5261 Ki Ki
5607 Kiana
5025 Kidman Park
5642 Kielpa
5084 Kilburn
5084 Kilburn North
5009 Kilkenny
5641 Kimba
5719 Kingoonya
5034 Kings Park
5223 Kingscote
5118 Kingsford
5331 Kingston On Murray
5049 Kingston Park
5275 Kingston Se
5062 Kingswood
5087 Klemzig
5223 Kohinoor
5717 Kokatha
5717 Kolendo
5717 Kondoolka
5270 Kongal
5353 Kongolia
5291 Kongorong
5661 Koolgera
5464 Koolunga
5575 Koolywurtie
5440 Koonamore
5650 Koongawa
5690 Koonibba
5417 Koonoona
5373 Koonunga
5279 Koorine
5558 Kooroona
5713 Kootaberra
5271 Koppamurra
5607 Koppio
5502 Korunye
5304 Kringin
5352 Krondorf
5278 Krongart
5115 Kudla
5201 Kuitpo
5172 Kuitpo Colony
5552 Kulpara
5037 Kurralta Park
5651 Kyancutta
5453 Kybunga
5262 Kybybolite
5172 Kyeema
5267 Laffer
5259 Lake Albert
5259 Lake Alexandrina
5238 Lake Carlet
5717 Lake Everard
5733 Lake Eyre
5440 Lake Frome
5717 Lake Gairdner
5611 Lake Gilles
5719 Lake Harris
5717 Lake Macfarlane
5255 Lake Plains
5713 Lake Torrens
5713 Lake Torrens Station
5555 Lake View
0872 Lambina
5302 Lameroo
5255 Langhorne Creek
5353 Langs Landing
5016 Largs Bay
5016 Largs North
5480 Laura
5680 Laura Bay
5271 Laurie Park
5068 Leabrook
5452 Leasingham
5150 Leawood Gardens
5731 Leigh Creek
5731 Leigh Creek Station
5417 Leighton
5240 Lenswood
5501 Lewiston
5355 Light Pass
5085 Lightsview
5715 Lincoln Gap
5607 Lincoln National Park
5065 Linden Park
5320 Lindley
5731 Lindon
5410 Linwood
5607 Lipson
5607 Little Douglas
5250 Littlehampton
5241 Lobethal
5271 Lochaber
5510 Lochiel
5633 Lock
5655 Lockes Claypan
5032 Lockleys
5253 Long Flat
5501 Long Plains
5153 Longwood
5160 Lonsdale
5160 Lonsdale Dc
5607 Louth Bay
5345 Loveday
5268 Lowan Vale
5330 Lowbank
5540 Lower Broughton
5131 Lower Hermitage
5211 Lower Inman Valley
5501 Lower Light
5062 Lower Mitcham
5333 Loxton
5333 Loxton North
5272 Lucindale
5602 Lucky Bay
5731 Lyndhurst
5351 Lyndoch
5062 Lynton
5343 Lyrup
5277 Maaoupe
5723 Mabel Creek
5153 Macclesfield
5121 Macdonald Park
5223 Macgillivray
5734 Macumba
5280 Magarey
5400 Magdala
5311 Maggea
5072 Magill
5072 Magill North
5717 Mahanewo
5573 Maitland
5267 Makin
5259 Malinong
5502 Mallala
5311 Malpas
5690 Maltee
5061 Malvern
5495 Mambray Creek
5602 Mangalo
5440 Manna Hill
5422 Mannanarie
5732 Manners Well
5086 Manningham
5238 Mannum
5414 Manoora
5012 Mansfield Park
5308 Mantung
5440 Manunda Station
5307 Marama
5355 Marananga
5137 Marble Hill
5271 Marcollat
5070 Marden
5049 Marino
5043 Marion
5575 Marion Bay
5330 Markaranka
5354 Marks Landing
5724 Marla
5033 Marleston
5033 Marleston Dc
5464 Marola
5413 Marrabel
5733 Marree
5733 Marree Station
5068 Marryatville
5440 Martins Well
5680 Maryvale
5170 Maslin Beach
5554 Matta Flat
5320 Maude
5095 Mawson Lakes
5454 Mayfield
5069 Maylands
5357 McBean Pound
5267 McCallum
5211 McCracken
5723 McDouall Peak
5157 McHarg Creek
5171 McLaren Flat
5171 McLaren Vale
5201 Meadows
5081 Medindie
5081 Medindie Gardens
5483 Melrose
5039 Melrose Park
5039 Melrose Park Dc
5552 Melton
5440 Melton Station
5264 Meningie
5264 Meningie East
5264 Meningie West
5223 Menzies
5308 Mercunda
5690 Merghiny
5311 Meribah
5523 Merriton
5731 Merty Merty
5501 Middle Beach
5223 Middle River
5609 Middleback Range
5213 Middleton
5602 Midgee
5291 Mil-Lel
5256 Milang
5031 Mile End
5031 Mile End South
5237 Milendella
5231 Millbrook
5720 Millers Creek
5280 Millicent
5034 Millswood
5602 Miltalie
0872 Mimili
5602 Minbrie
5431 Minburra
5431 Minburra Plain
5431 Minburra Station
5309 Mindarie
5440 Mingary
5291 Mingbool
5575 Minlaton
5654 Minnipa
5415 Mintaro
5422 Minvalara
5700 Miranda
5062 Mitcham
5062 Mitcham Shopping Centre
5632 Mitchell
5043 Mitchell Park
5602 Mitchellville
5690 Mitchidy Moola
5169 Moana
5253 Mobilong
5353 Moculta
5092 Modbury
5092 Modbury Heights
5092 Modbury North
5278 Moerlong
5254 Monarto
5254 Monarto South
5342 Monash
5277 Monbulla
5417 Mongolata
5134 Montacute
5172 Montarra
5253 Monteith
5432 Moockra
5607 Moody
5732 Moolawatana
5440 Mooleulooloo
5730 Moolooloo
5717 Moonaree
5558 Moonta
5558 Moonta Bay
5558 Moonta Mines
5291 Moorak
5730 Moorillah
5301 Moorlands
5332 Moorook
5332 Moorook South
5355 Moppa
5431 Morchard
5320 Morgan
5371 Morn Hill
5162 Morphett Vale
5320 Morphetts Flat
5043 Morphettville
5671 Mortana
5641 Moseley
5214 Mosquito Hill
5730 Motpena
5713 Mount Arden
5251 Mount Barker
5251 Mount Barker Junction
5251 Mount Barker Springs
5251 Mount Barker Summit
5723 Mount Barry
5275 Mount Benson
5418 Mount Bryan
5419 Mount Bryan East
5279 Mount Burr
5267 Mount Charles
5723 Mount Clarence Station
5210 Mount Compass
5671 Mount Cooper
5351 Mount Crawford
5654 Mount Damper
5607 Mount Drummond
5607 Mount Dutton Bay
5720 Mount Eba
5730 Mount Falkland
5731 Mount Freeling
5290 Mount Gambier
5291 Mount Gambier
5291 Mount Gambier East
5291 Mount Gambier West
5155 Mount George
5434 Mount Havelock
5607 Mount Hope
5717 Mount Ive
5211 Mount Jagged
5670 Mount Joy
5271 Mount Light
5731 Mount Lyndhurst
5210 Mount Magnificent
5374 Mount Mary
5279 Mount McIntyre
5353 Mount McKenzie
5255 Mount Observation
5064 Mount Osmond
5235 Mount Pleasant
5734 Mount Sarah
5291 Mount Schank
5732 Mount Serle
5461 Mount Templeton
5244 Mount Torrens
5440 Mount Victor Station
5720 Mount Vivian
5670 Mount Wedge
5723 Mount Willoughby
5271 Moyhall
5680 Mudamuckla
5732 Mulga View
5731 Mulgaria
5719 Mulgathing
5255 Mulgundawa
5733 Mulka
5608 Mullaquana
5733 Muloorina
5440 Mulyungarie
5700 Mundallio
5440 Mundi Mundi
5340 Mundic Creek
5214 Mundoo Island
5555 Mundoora
5733 Mundowdna
5270 Mundulla
5270 Mundulla West
5733 Mungeranie
5115 Munno Para
5115 Munno Para Downs
5115 Munno Para West
5320 Murbko
5607 Murdinga
5642 Murlong
5609 Murninnie Beach
5731 Murnpeowie
0872 Murputja
5253 Murrawong
5253 Murray Bridge
5254 Murray Bridge
5253 Murray Bridge East
5253 Murray Bridge North
5253 Murray Bridge South
5481 Murray Town
5340 Murtho
5221 Muston
5440 Mutooroo
5153 Mylor
5611 Myola Station
5254 Mypolonga
5202 Myponga
5202 Myponga Beach
5064 Myrtle Bank
5731 Myrtle Springs
5440 Nackara
5690 Nadia
5354 Naidia
5083 Nailsworth
5360 Nain
5252 Nairne
5255 Nalpa
5558 Nalyappa
5690 Nanbona
5210 Nangkita
5277 Nangwarry
5550 Nantawarra
5540 Napperby
5271 Naracoorte
5655 Narlaby
5523 Narridy
5730 Narrina
5259 Narrung
5259 Naturi
5374 Neales Flat
5495 Nectar Brook
5540 Nelshaby
5291 Nene Valley
5732 Nepabunna
5223 Nepean Bay
5062 Netherby
5301 Netherton
5037 Netley
5440 Netley Gap
5015 New Port
5333 New Residence
5554 New Town
5357 New Well
5223 Newland
5074 Newton
5374 Ngapala
5302 Ngarkat
5238 Nildottie
5730 Nilpena
5723 Nilpinna Station
5560 Ninnes
5168 Noarlunga Centre
5168 Noarlunga Downs
5717 Nonning
5276 Nora Creina
5204 Normanville
5006 North Adelaide
5006 North Adelaide Melbourne St
5556 North Beach
5417 North Booborowie
5048 North Brighton
5223 North Cape
5018 North Haven
5431 North Hills
5732 North Moolooloo
5558 North Moonta
5037 North Plympton
5607 North Shields
5320 North West Bend
5558 North Yelta
5253 Northern Heights
5085 Northfield
5085 Northgate
5136 Norton Summit
5067 Norwood
5067 Norwood South
5357 Notts Well
5040 Novar Gardens
5690 Nullarbor
5680 Nunjikompita
5355 Nuriootpa
5523 Nurom
5256 Nurragi
0872 Nyapari
5690 Oak Valley
5243 Oakbank
5086 Oakden
5713 Oakden Hills
5046 Oaklands Park
5417 Oakvale Station
5291 Ob Flat
5440 Olary
5341 Old Calperum
5417 Old Koomooloo
5168 Old Noarlunga
5161 Old Reynella
5238 Old Teal Flat
5725 Olympic Dam
5114 One Tree Hill
5163 Onkaparinga Heights
5163 Onkaparinga Hills
5422 Oodla Wirra
5734 Oodnadatta
5730 Oratunga Station
5431 Orroroo
5017 Osborne
5013 Ottoway
5440 Oulnina
5440 Oulnina Park
5440 Outalpa
5018 Outer Harbor
5330 Overland Corner
5082 Ovingham
5460 Owen
5271 Padthaway
5245 Paechtown
5172 Pages Flat
5357 Paisley
5670 Palkagee
5254 Pallamana
5237 Palmer
5733 Pandie Pandie
5715 Pandurra
5652 Paney
5641 Panitya
5041 Panorama
5096 Para Hills
5096 Para Hills West
5093 Para Vista
5730 Parachilna
5132 Paracombe
5075 Paradise
5106 Parafield
5107 Parafield Gardens
5720 Parakylia
5108 Paralowie
5558 Paramatta
5422 Paratoo
5203 Parawa
5417 Parcoola
5501 Parham
5303 Parilla
5340 Paringa
5201 Paris Creek
5043 Park Holme
5063 Parkside
5422 Parnaroo
5220 Parndana
5301 Parrakie
5575 Parsons Beach
5311 Paruna
5042 Pasadena
5552 Paskeville
5333 Pata
5070 Payneham
5070 Payneham South
5301 Peake
5607 Pearlah
5304 Peebinga
5374 Peep Hill
5431 Pekina
5222 Pelican Lagoon
5291 Pelican Point
5238 Pellaring Flat
5121 Penfield
5121 Penfield Gardens
5222 Penneshaw
5013 Pennington
5277 Penola
5690 Penong
5353 Penrice
5453 Penwortham
5680 Perlubie
5713 Pernatty
5308 Perponda
5422 Peterborough
5016 Peterhead
5571 Petersville
5267 Petherick
5680 Petina
5252 Petwood
5351 Pewsey Vale
5151 Piccadilly
5680 Piednippie
5340 Pike River
5720 Pimba
5661 Pimbaacla
5732 Pinda Springs
5419 Pine Creek
5440 Pine Creek Station
5269 Pine Hill
5571 Pine Point
5417 Pine Valley Station
5460 Pinery
5680 Pinjarra Station
5641 Pinkawillinie
5400 Pinkerton Plains
5275 Pinks Beach
5304 Pinnaroo
0872 Pipalyatjara
5540 Pirie East
5277 Pleasant Park
5440 Plumbago
5038 Plympton
5038 Plympton Park
5607 Point Boston
5601 Point Lowly
5601 Point Lowly North
5259 Point McLeay
5374 Point Pass
5573 Point Pearce
5577 Point Souttar
5256 Point Sturt
5575 Point Turton
5670 Polda
5453 Polish Hill River
5259 Poltalloch
5238 Pompoota
5238 Ponde
5655 Poochera
5268 Pooginagoric
5330 Pooginook
5607 Poonindie
5095 Pooraka
5222 Porky Flat
5015 Port Adelaide
5552 Port Arthur
5700 Port Augusta
5701 Port Augusta
5700 Port Augusta North
5700 Port Augusta West
5601 Port Bonython
5522 Port Broughton
5540 Port Davis
5212 Port Elliot
5501 Port Gawler
5495 Port Germein
5602 Port Gibbon
5558 Port Hughes
5580 Port Julia
5671 Port Kenny
5606 Port Lincoln
5607 Port Lincoln
5606 Port Lincoln South
5291 Port Macdonnell
5238 Port Mannum
5576 Port Moorowie
5604 Port Neill
5167 Port Noarlunga
5167 Port Noarlunga South
5700 Port Paterson
5540 Port Pirie
5540 Port Pirie South
5540 Port Pirie West
5575 Port Rickaby
5573 Port Victoria
5581 Port Vincent
5550 Port Wakefield
5173 Port Willunga
5416 Porter Lagoon
5434 Prelinna
5570 Price
5550 Proof Range
5082 Prospect
5082 Prospect East
5201 Prospect Hill
5440 Pualco Range
0872 Pukatja
5680 Puntabie
5238 Punthari
5353 Punyelroo
5680 Pureba
5238 Purnong
5720 Purple Downs
5730 Puttapa
5333 Pyap
5333 Pyap West
5652 Pygery
5322 Qualco
5014 Queenstown
5440 Quinyambie
5417 Quondong
5433 Quorn
5291 Racecourse Bay
5322 Ramco
5322 Ramco Heights
5575 Ramsay
5204 Rapid Bay
5255 Red Creek
5502 Redbanks
5521 Redhill
5097 Redwood Park
5275 Reedy Creek
5502 Reeves Plains
5010 Regency Park
5118 Reid
5280 Rendelsham
5341 Renmark
5341 Renmark North
5341 Renmark South
5341 Renmark West
5008 Renown Park
5161 Reynella
5161 Reynella East
5412 Rhynie
5033 Richmond
5097 Ridgehaven
5008 Ridleyton
5540 Risdon Park
5540 Risdon Park South
5253 Riverglades
5253 Riverglen
5120 Riverlea Park
5412 Riverton
5276 Robe
5381 Robertstown
5464 Rochester
5254 Rockleigh
5280 Rocky Camp
5254 Rocky Gully
5381 Rocky Plain
5238 Rocky Point
5571 Rogues Point
5067 Rose Park
5350 Rosedale
5275 Rosetown
5013 Rosewater
5013 Rosewater East
5371 Roseworthy
5072 Rosslyn Park
5073 Rostrevor
5352 Rowland Flat
5725 Roxby Downs
5725 Roxby Downs Station
5014 Royal Park
5070 Royston Park
5642 Rudall
5000 Rundle Mall
5413 Saddleworth
5461 Saints
5255 Salem
5108 Salisbury
5108 Salisbury Downs
5109 Salisbury East
5109 Salisbury East Northbri Ave
5109 Salisbury Heights
5108 Salisbury North
5108 Salisbury North Whites Road
5109 Salisbury Park
5109 Salisbury Plain
5106 Salisbury South
5106 Salisbury South Dc
5264 Salt Creek
5401 Salter Springs
5433 Saltia
5114 Sampson Flat
5309 Sandalwood
5255 Sandergrove
5237 Sanderston
5571 Sandilands
5356 Sandleton
5350 Sandy Creek
5275 Sandy Grove
5222 Sapphiretown
5680 Sceale Bay
5311 Schell Well
5153 Scott Creek
5049 Seacliff
5049 Seacliff Park
5047 Seacombe Gardens
5047 Seacombe Heights
5169 Seaford
5169 Seaford Heights
5169 Seaford Meadows
5169 Seaford Rise
5223 Seal Bay
5023 Seaton
5049 Seaview Downs
5280 Sebastopol
5204 Second Valley
5611 Secret Rocks
5353 Sedan
5223 Seddon
5083 Sefton Park
5174 Sellicks Beach
5174 Sellicks Hill
5019 Semaphore
5019 Semaphore Park
5019 Semaphore South
5268 Senior
5355 Seppeltsfield
5453 Sevenhill
5434 Shaggy Ridge
5267 Shaugh
5371 Shea-Oak Log
5581 Sheaoak Flat
5158 Sheidow Park
5607 Sheringa
5301 Sherlock
5267 Sherwood
5279 Short
5717 Siam
5204 Silverton
5734 Simpson Desert
5072 Skye
5607 Sleaford
5114 Smithfield
5114 Smithfield Plains
5680 Smoky Bay
5520 Snowtown
5641 Solomon
5540 Solomontown
5044 Somerton Park
5048 South Brighton
5713 South Gap
5550 South Hummocks
5573 South Kilkerran
5038 South Plympton
5280 Southend
5031 Southwark
5454 Spalding
5345 Spectacle Lake
5271 Spence
5453 Spring Farm
5453 Spring Gully
5062 Springfield
5235 Springton
5291 Square Mile
5097 St Agnes
5011 St Clair
5064 St Georges
5252 St Ives
5373 St Johns
5110 St Kilda
5356 St Kitts
5042 St Marys
5068 St Morris
5069 St Peters
5415 Stanley
5453 Stanley Flat
5582 Stansbury
5000 Station Arcade
5413 Steelton
5356 Steinfeld
5433 Stephenston
5069 Stepney
5271 Stewart Range
5152 Stirling
5710 Stirling North
5410 Stockport
5355 Stockwell
5460 Stockyard Creek
5330 Stockyard Plain
5223 Stokes Bay
5480 Stone Hut
5352 Stone Well
5066 Stonyfell
5461 Stow
5255 Strathalbyn
5680 Streaky Bay
5271 Struan
5731 Strzelecki Desert
5320 Stuart
5720 Stuarts Creek
5047 Sturt
5417 Sturt Vale
5583 Sultana Point
5141 Summertown
5322 Sunlands
5422 Sunnybrae
5353 Sunnydale
5253 Sunnyside
5552 Sunnyvale
5126 Surrey Downs
5374 Sutherlands
5291 Suttontown
5354 Swan Reach
5253 Swanport
5270 Swede Flat
5259 Tailem Bend
5260 Tailem Bend
5311 Taldra
5670 Talia
5280 Tantanoola
5352 Tanunda
5017 Taperoo
5311 Taplan
5275 Taratap
5701 Tarcoola
5431 Tarcowie
5411 Tarlee
5413 Tarnma
5277 Tarpeena
5171 Tatachilla
5235 Taunton
5330 Taylorville
5330 Taylorville Station
5091 Tea Tree Gully
5238 Teal Flat
5540 Telowie
5371 Templers
5022 Tennyson
5440 Tepco Station
5254 Tepko
5072 Teringie
5421 Terowie
5271 The Gap
5577 The Pines
5172 The Range
5031 Thebarton
5690 Thevenard
5554 Thomas Plain
5501 Thompson Beach
5082 Thorngate
5280 Thornlea
5432 Three Creeks
5552 Thrington
5717 Thurlga
5607 Tiatukia
5555 Tickera
5571 Tiddy Widdy Beach
0872 Tieyon
5440 Tikalina
5275 Tilley Swamp
5266 Tintinara
5734 Todmorden
5256 Tolderol
5042 Tonsley
5607 Tooligie
5255 Tooperang
5253 Toora
5065 Toorak Gardens
5607 Tootenilla
5015 Torrens Island
5062 Torrens Park
5203 Torrens Vale
5031 Torrensville
5031 Torrensville Plaza
5413 Tothill Belt
5413 Tothill Creek
5250 Totness
5353 Towitta
5073 Tranmere
5073 Tranmere North
5068 Trinity Gardens
5158 Trott Park
5356 Truro
5607 Tulka
5605 Tumby Bay
5236 Tungkillo
5203 Tunkalilla
5065 Tusmore
5501 Two Wells
5671 Tyringa
5422 Ucolta
5607 Uley
5114 Uleybury
5419 Ulooloo
5633 Ulyerra
5732 Umberatana
0872 Umuwa
5451 Undalya
5032 Underdale
5607 Ungarra
5061 Unley
5061 Unley Park
5717 Uno
5434 Upalinna
5131 Upper Hermitage
5156 Upper Sturt
5142 Uraidla
5573 Urania
5064 Urrbrae
5690 Uworra
5081 Vale Park
5093 Valley View
5311 Veitch
5607 Venus Bay
5245 Verdun
5603 Verran
5211 Victor Harbor
5211 Victor Harbor Central
5352 Vine Vale
5120 Virginia
5091 Vista
5223 Vivonne Bay
5640 Waddikee
5440 Wadnaminga
5330 Waikerie
5211 Waitpinga
5238 Walker Flat
5081 Walkerville
5098 Walkley Heights
5254 Wall Flat
5661 Wallala
5556 Wallaroo
5554 Wallaroo Mines
5556 Wallaroo Plain
5713 Wallerberdina
5431 Walloway
5264 Waltowa
5700 Wami Kata
5310 Wanbi
5690 Wandana
5523 Wandearah East
5523 Wandearah West
5291 Wandilo
5607 Wangary
5275 Wangolina
5607 Wanilla
5332 Wappilka
5556 Warburto
5118 Ward Belt
5522 Ward Hill
5540 Warnertown
5417 Warnes
5577 Warooka
5422 Waroonee
5046 Warradale
5046 Warradale North
5650 Warramboo
5730 Warraweena
5715 Wartaka
5454 Washpool
5400 Wasleys
0872 Watarru
5461 Watchman
5066 Waterfall Gully
5413 Waterloo
5110 Waterloo Corner
5452 Watervale
0872 Watinuma
5690 Watraba
5203 Wattle Flat
5066 Wattle Park
5280 Wattle Range
5279 Wattle Range East
5440 Waukaringa
5573 Wauraltee
5034 Wayville
5501 Webb Beach
5606 Wedge Island
5440 Weekeroo
5495 Weeroona Island
5573 Weetulta
5724 Welbourn Hill
5007 Welland
5259 Wellington
5259 Wellington East
5278 Wepar
5482 Wepowie
5732 Wertaloona
5024 West Beach
5491 West Bundaleer
5008 West Croydon
5007 West Hindmarsh
5021 West Lakes
5020 West Lakes Shore
5275 West Range
5033 West Richmond
5680 Westall
5041 Westbourne Park
5268 Western Flat
5223 Western River
5320 Westons Flat
5603 Wharminda
5254 White Hill
5575 White Hut
5253 White Sands
5690 White Well Corner
5607 Whites Flat
5607 Whites River
5172 Whites Valley
5461 Whitwarta
5600 Whyalla
5601 Whyalla Barson
5609 Whyalla Jenkins
5608 Whyalla Norrie
5608 Whyalla Norrie East
5608 Whyalla Norrie North
5600 Whyalla Playford
5608 Whyalla Stuart
5420 Whyte Yarcowie
5440 Wiawera
5330 Wigley Flat
5641 Wilcherry
5432 Wilcowie
5271 Wild Dog Valley
5501 Wild Horse Plains
5719 Wilgena
5713 Wilkatana Station
5301 Wilkawatt
5419 Willalo
5267 Willalooka
5554 Willamulka
5118 Willaston
5723 William Creek
5351 Williamstown
5432 Willippa
5433 Willochra
5222 Willoughby
5253 Willow Banks
5211 Willow Creek
5434 Willow Springs
5431 Willowie
5222 Willson River
5172 Willunga
5172 Willunga Hill
5172 Willunga South
5255 Willyaroo
5485 Wilmington
5501 Windsor
5087 Windsor Gardens
5013 Wingfield
5343 Winkie
5440 Winnininnie
5700 Winninowie
5713 Wintabatinyana
5723 Wintinna
5570 Winulta
5481 Wirrabara
5719 Wirraminna
5730 Wirrealpa
5267 Wirrega
5204 Wirrina Cove
5661 Wirrulla
5223 Wisanger
5251 Wistow
5731 Witchelina
5432 Witchitie
5671 Witera
5734 Witjira
5520 Wokurna
5269 Wolseley
5320 Wombats Rest
5440 Wompinie
5238 Wongulla
5481 Wongyarra
5419 Wonna
5340 Wonuarra
5255 Woodchester
5162 Woodcroft
5072 Woodforde
5254 Woodlane
5311 Woodleigh
5253 Woods Point
5244 Woodside
5011 Woodville
5012 Woodville Gardens
5012 Woodville North
5011 Woodville Park
5011 Woodville South
5011 Woodville West
5575 Wool Bay
5330 Woolpunda
5412 Woolshed Flat
5400 Woolsheds
5732 Wooltana
5272 Woolumbool
5701 Woolundunga
5720 Woomera
5381 Worlds End
5291 Worrolong
5434 Worumba
5271 Wrattonbully
5652 Wudinna
5311 Wunkar
5291 Wye
5306 Wynarka
5127 Wynn Vale
5275 Wyomi
5470 Yacka
5713 Yadlamalka
5291 Yahl
5641 Yalanda
5690 Yalata
5607 Yallunda Flat
5431 Yalpara
5715 Yalymboo
5340 Yamba
5680 Yanerbie
5653 Yaninee
5203 Yankalilla
5732 Yankaninna
5661 Yantanabie
5432 Yanyarrie
5717 Yardea
5433 Yarrah
5440 Yarramba
5126 Yatala Vale
5422 Yatina
5114 Yattalunga
5632 Yeelanna
5690 Yellabinna
5558 Yelta
5641 Yeltana
5332 Yinkanie
5493 Yongala
5573 Yorke Valley
5576 Yorketown
5238 Younghusband
5238 Younghusband Holdings
5715 Yudnapinna
5261 Yumali
5690 Yumbarra
5172 Yundi
5440 Yunta
0872 Yunyarinyi
5254 Zadows Landing`;

const TAS = `7315 Abbotsham
7112 Abels Bay
7310 Aberdeen
7306 Acacia Hills
7320 Acton
7170 Acton Park
7150 Adventure Bay
7216 Akaroa
7263 Alberton
7330 Alcomie
7150 Allens Rivulet
7150 Alonnah
7310 Ambleside
7120 Andover
7264 Ansons Bay
7120 Antill Ponds
7150 Apollo Bay
7190 Apslawn
7030 Apsley
7330 Arthur River
7030 Arthurs Lake
7011 Austins Ferry
7213 Avoca
7120 Baden
7270 Badger Head
7030 Bagdad
7307 Bakers Beach
7265 Banca
7267 Bangor
7150 Barnes Bay
7054 Barretta
7306 Barrington
7004 Battery Point
7270 Beaconsfield
7215 Beaumaris
7270 Beauty Point
7252 Beechford
7253 Bell Bay
7018 Bellerive
7254 Bellingham
7212 Ben Lomond
7011 Berriedale
7306 Beulah
7215 Bicheno
7216 Binalong Bay
7162 Birchs Bay
7303 Birralee
7301 Bishopsbourne
7140 Black Hills
7321 Black River
7052 Blackmans Bay
7250 Blackstone Heights
7275 Blackwall
7301 Blackwood Creek
7212 Blessington
7255 Blue Rocks
7260 Blumont
7321 Boat Harbour
7321 Boat Harbour Beach
7053 Bonnet Hill
7264 Boobyalla
7177 Boomer Bay
7030 Bothwell
7140 Boyer
7302 Bracknell
7140 Bradys Lake
7304 Brandum
7261 Branxholm
7258 Breadalbane
7175 Bream Creek
7304 Breona
7277 Bridgenorth
7030 Bridgewater
7262 Bridport
7030 Brighton
7330 Brittons Swamp
7030 Broadmarsh
7330 Broadmeadows
7140 Bronte Park
7320 Brooklyn
7116 Brooks Bay
7190 Buckland
7256 Bungaree
7320 Burnie
7212 Burns Creek
7140 Bushy Park
7140 Butlers Gorge
7116 Cairns Bay
7325 Calder
7170 Cambridge
7320 Camdale
7316 Camena
7026 Campania
7210 Campbell Town
7257 Cape Barren Island
7182 Cape Pillar
7264 Cape Portland
7184 Cape Raoul
7173 Carlton
7173 Carlton River
7291 Carrick
7151 Casey
7116 Castle Forbes Bay
7315 Castra
7304 Caveside
7304 Central Plateau
7306 Cethana
7215 Chain Of Lagoons
7112 Charlotte Cove
7321 Chasm Creek
7011 Chigwell
7330 Christmas Hills
7304 Chudleigh
7011 Claremont
7270 Clarence Point
7019 Clarendon Vale
7306 Claude Road
7211 Cleveland
7020 Clifton Beach
7303 Cluan
7027 Colebrook
7215 Coles Bay
7012 Collinsvale
7211 Conara
7054 Coningham
7173 Connellys Marsh
7320 Cooee
7174 Copping
7321 Corinna
7215 Cornwall
7330 Couta Rocks
7321 Cowrie Point
7109 Crabtree
7306 Cradle Mountain
7109 Cradoc
7030 Cramps Bay
7190 Cranbrook
7321 Crayfish Creek
7024 Cremorne
7302 Cressy
7260 Cuckoo
7316 Cuprona
7256 Currie
7112 Cygnet
7304 Dairy Plains
7151 Davis
7212 Deddington
7140 Dee
7112 Deep Bay
7304 Deloraine
7150 Dennes Point
7264 Derby
7140 Derwent Bridge
7009 Derwent Park
7321 Detention
7275 Deviot
7300 Devon Hills
7310 Devonport
7252 Dilston
7304 Doctors Point
7325 Doctors Rocks
7173 Dodges Ferry
7190 Dolphin Sands
7310 Don
7215 Douglas River
7215 Douglas-Apsley
7117 Dover
7320 Downlands
7010 Dowsing Point
7030 Dromedary
7025 Dulcot
7177 Dunalley
7304 Dunorlan
7005 Dynnyrne
7030 Dysart
7179 Eaglehawk Neck
7321 East Cam
7310 East Devonport
7250 East Launceston
7321 East Ridgley
7264 Eddystone
7321 Edgcumbe Beach
7330 Edith Creek
7256 Egg Lagoon
7112 Eggs And Bacon Bay
7030 Elderslie
7054 Electrona
7304 Elizabeth Town
7140 Ellendale
7325 Elliott
7255 Emita
7320 Emu Heights
7211 Epping Forest
7310 Erriba
7310 Eugenana
7212 Evandale
7275 Exeter
7303 Exton
7215 Falmouth
7140 Fentonbury
7054 Fern Tree
7214 Fingal
7140 Fitzgerald
7030 Flintstone
7140 Florentine
7325 Flowerdale
7163 Flowerpot
7270 Flowery Gully
7173 Forcett
7330 Forest
7260 Forester
7182 Fortescue
7310 Forth
7310 Forthside
7215 Four Mile Creek
7275 Frankford
7113 Franklin
7215 Freycinet
7215 Friendly Beaches
7030 Gagebrook
7112 Garden Island Creek
7112 Gardners Bay
7315 Gawler
7116 Geeveston
7015 Geilston Bay
7253 George Town
7264 Gladstone
7109 Glaziers Bay
7000 Glebe
7109 Glen Huon
7109 Glendevie
7140 Glenfern
7275 Glengarry
7012 Glenlusk
7140 Glenora
7010 Glenorchy
7254 Golconda
7304 Golden Valley
7010 Goodwood
7150 Gordon
7466 Gormanston
7216 Goshen
7216 Goulds Country
7306 Gowrie Park
7030 Granton
7469 Granville Harbour
7017 Grasstree Hill
7256 Grassy
7276 Gravelly Beach
7215 Gray
7150 Great Bay
7270 Greens Beach
7140 Gretna
7277 Grindelwald
7109 Grove
7321 Guildford
7315 Gunns Plains
7290 Hadspen
7292 Hagley
7140 Hamilton
7321 Hampshire
7307 Harford
7109 Hastings
7320 Havenview
7307 Hawley Beach
7140 Hayes
7151 Heard Island
7321 Hellyer
7325 Henrietta
7030 Herdsmans Cove
7030 Hermitage
7264 Herrick
7316 Heybridge
7321 Highclere
7183 Highcroft
7320 Hillcrest
7252 Hillwood
7000 Hobart
7140 Hollow Tree
7275 Holwell
7017 Honeywood
7054 Howden
7018 Howrah
7316 Howth
7055 Huntingfield
7112 Huon Island
7109 Huonville
7109 Ida Bay
7030 Interlaken
7248 Invermay
7330 Irishtown
7304 Jackeys Marsh
7030 Jericho
7260 Jetsonville
7109 Judbury
7260 Kamona
7150 Kaoota
7140 Karanja
7267 Karoola
7270 Kayena
7176 Kellevie
7270 Kelso
7030 Kempton
7155 Kettering
7255 Killiecrankie
7150 Killora
7304 Kimberley
7310 Kindred
7249 Kings Meadows
7050 Kingston
7050 Kingston Beach
7187 Koonya
7140 Lachlan
7255 Lackrana
7255 Lady Barron
7210 Lake Leake
7467 Lake Margaret
7030 Lake Sorell
7140 Lake St Clair
7267 Lalla
7275 Lanena
7325 Lapoinya
7307 Latrobe
7021 Lauderdale
7250 Launceston
7140 Lawitta
7254 Lebrina
7255 Leeka
7252 Lefroy
7277 Legana
7263 Legerwood
7315 Leith
7120 Lemont
7008 Lenah Valley
7054 Leslie Vale
7120 Levendale
7173 Lewisham
7030 Liawenee
7304 Liena
7260 Lietinna
7301 Liffey
7330 Lileah
7310 Lillico
7268 Lilydale
7015 Lindisfarne
7260 Lisle
7140 Little Pine Lagoon
7190 Little Swanport
7255 Loccota
7275 Loira
7140 London Lakes
7253 Long Reach
7301 Longford
7150 Longley
7109 Lonnavale
7315 Loongana
7256 Loorana
7306 Lorinna
7216 Lottah
7253 Low Head
7306 Lower Barrington
7306 Lower Beulah
7109 Lower Longley
7030 Lower Marshes
7005 Lower Sandy Bay
7054 Lower Snug
7267 Lower Turners Marsh
7109 Lower Wattle Grove
7310 Lower Wilmot
7316 Loyetea
7109 Lucaston
7255 Lughrata
7321 Luina
7252 Lulworth
7150 Lunawanna
7109 Lune River
7009 Lutana
7109 Lymington
7256 Lymwood
7468 Macquarie Heads
7151 Macquarie Island
7140 Macquarie Plains
7140 Magra
7140 Malbina
7030 Mangalore
7214 Mangana
7054 Margate
7175 Marion Bay
7330 Marrawah
7214 Mathinna
7321 Mawbanna
7151 Mawson
7304 Mayberry
7140 Maydena
7248 Mayfield
7151 McDonald Islands
7140 Meadowbank
7304 Meander
7330 Mella
7310 Melrose
7030 Melton Mowbray
7255 Memana
7330 Mengha
7304 Mersey Forest
7305 Merseylea
7325 Meunna
7310 Miandetta
7306 Middlesex
7163 Middleton
7171 Midway Point
7030 Miena
7325 Milabena
7030 Millers Bluff
7310 Moina
7304 Mole Creek
7140 Molesworth
7304 Moltema
7330 Montagu
7018 Montagu Bay
7304 Montana
7320 Montello
7010 Montrose
7321 Montumana
7140 Moogara
7009 Moonah
7321 Mooreville
7264 Moorina
7325 Moorleah
7030 Morass Bay
7307 Moriarty
7018 Mornington
7252 Mount Direction
7140 Mount Field
7325 Mount Hicks
7140 Mount Lloyd
7007 Mount Nelson
7306 Mount Roland
7170 Mount Rumney
7120 Mount Seymour
7000 Mount Stuart
7264 Mount William
7109 Mountain River
7248 Mowbray
7178 Murdunna
7264 Musselroe Bay
7325 Myalla
7259 Myrtle Bank
7330 Nabageena
7260 Nabowla
7256 Naracoopa
7140 National Park
7321 Natone
7304 Needles
7054 Neika
7330 Nelson Bay
7140 New Norfolk
7008 New Town
7248 Newnham
7250 Newstead
7112 Nicholls Rivulet
7315 Nietta
7212 Nile
7306 Nook
7150 North Bruny
7000 North Hobart
7268 North Lilydale
7315 North Motton
7260 North Scottsdale
7307 Northdown
7250 Norwood
7275 Notley Hills
7306 Nowhere Else
7184 Nubeena
7256 Nugara
7172 Nugent
7259 Nunamara
7019 Oakdowns
7303 Oaks
7120 Oatlands
7320 Ocean Vista
7017 Old Beach
7325 Oldina
7325 Oonah
7023 Opossum Bay
7190 Orford
7172 Orielton
7303 Osmaston
7140 Osterley
7017 Otago
7140 Ouse
7150 Oyster Cove
7255 Palana
7310 Paloona
7306 Paradise
7120 Parattah
7320 Park Grove
7304 Parkham
7320 Parklands
7321 Parrawe
7259 Patersonia
7172 Pawleena
7120 Pawtella
7256 Pearshape
7256 Pegarah
7030 Pelham
7150 Pelverata
7316 Penguin
7171 Penna
7300 Perth
7109 Petcheys Bay
7264 Pioneer
7254 Pipers Brook
7252 Pipers River
7140 Plenty
7302 Poatina
7116 Police Point
7030 Pontville
7190 Pontypool
7182 Port Arthur
7116 Port Huon
7321 Port Latta
7307 Port Sorell
7300 Powranna
7185 Premaydena
7325 Preolenna
7316 Preservation Bay
7315 Preston
7173 Primrose Sands
7306 Promised Land
7250 Prospect
7250 Prospect Vale
7249 Punchbowl
7216 Pyengana
7292 Quamby Bend
7304 Quamby Brook
7000 Queens Domain
7467 Queenstown
7310 Quoiba
7305 Railton
7109 Raminea
7112 Randalls Bay
7109 Ranelagh
7255 Ranga
7250 Ravenswood
7109 Recherche
7304 Red Hills
7330 Redpa
7304 Reedy Marsh
7256 Reekara
7258 Relbia
7469 Renison Bell
7254 Retreat
7304 Reynolds Neck
7190 Rheban
7120 Rhyndaston
7316 Riana
7025 Richmond
7054 Ridgeway
7321 Ridgley
7263 Ringarooma
7017 Risdon
7016 Risdon Vale
7250 Riverside
7275 Robigana
7248 Rocherlea
7170 Roches Beach
7321 Rocky Cape
7190 Rocky Hills
7330 Roger River
7019 Rokeby
7306 Roland
7320 Romaine
7015 Rose Bay
7470 Rosebery
7140 Rosegarland
7010 Rosetta
7292 Rosevale
7277 Rosevears
7018 Rosny
7018 Rosny Park
7209 Ross
7213 Rossarden
7320 Round Hill
7270 Rowella
7213 Royal George
7190 Runnymede
7264 Rushy Lagoon
7186 Saltwater River
7150 Sandfly
7020 Sandford
7005 Sandy Bay
7307 Sassafras
7321 Savage River
7215 Scamander
7330 Scopus
7330 Scotchtown
7260 Scottsdale
7256 Sea Elephant
7292 Selbourne
7170 Seven Mile Beach
7215 Seymour
7030 Shannon
7307 Shearwater
7306 Sheffield
7320 Shorewell Park
7270 Sidmouth
7150 Simpsons Bay
7321 Sisters Beach
7325 Sisters Creek
7186 Sloping Main
7330 Smithton
7054 Snug
7322 Somerset
7172 Sorell
7140 Sorell Creek
7022 South Arm
7150 South Bruny
7320 South Burnie
7330 South Forest
7004 South Hobart
7249 South Launceston
7264 South Mount Cameron
7315 South Nietta
7315 South Preston
7316 South Riana
7310 South Spreyton
7260 South Springfield
7109 Southport
7109 Southport Lagoon
7315 Spalford
7315 Sprent
7310 Spreyton
7190 Spring Beach
7260 Springfield
7307 Squeaking Point
7216 St Helens
7250 St Leonards
7215 St Marys
7331 Stanley
7306 Staverton
7030 Steppes
7216 Stieglitz
7120 Stonehenge
7119 Stonor
7252 Stony Head
7310 Stony Rise
7306 Stoodley
7184 Stormlea
7213 Storys Creek
7321 Stowport
7468 Strahan
7109 Strathblane
7139 Strathgordon
7140 Strickland
7255 Strzelecki
7140 Styx
7316 Sulphur Creek
7250 Summerhill
7305 Sunnyside
7116 Surges Bay
7256 Surprise Bay
7116 Surveyors Bay
7252 Swan Bay
7275 Swan Point
7190 Swansea
7120 Swanston
7325 Table Cape
7325 Takone
7263 Talawa
7180 Taranna
7259 Targa
7310 Tarleton
7053 Taroona
7140 Tarraleah
7259 Tayene
7017 Tea Tree
7264 Telita
7330 Temma
7321 Tewkesbury
7216 The Gardens
7307 Thirlstane
7120 Tiberias
7054 Tinderbox
7030 Tods Corner
7330 Togari
7301 Toiberry
7007 Tolmans Hill
7262 Tomahawk
7260 Tonganah
7209 Tooms Lake
7018 Tranmere
7250 Travellers Rest
7263 Trenah
7250 Trevallyn
7190 Triabunna
7469 Trial Harbour
7330 Trowutta
7310 Tugrah
7260 Tulendeena
7321 Tullah
7120 Tunbridge
7120 Tunnack
7254 Tunnel
7315 Turners Beach
7267 Turners Marsh
7140 Tyenna
7315 Ulverstone
7268 Underwood
7212 Upper Blessington
7320 Upper Burnie
7315 Upper Castra
7214 Upper Esk
7321 Upper Natone
7215 Upper Scamander
7321 Upper Stowport
7150 Upper Woodstock
7140 Uxbridge
7112 Verona Sands
7140 Victoria Valley
7030 Waddamana
7304 Walls Of Jerusalem
7321 Waratah
7018 Warrane
7261 Warrentinna
7262 Waterhouse
7109 Waterloo
7109 Wattle Grove
7172 Wattle Hill
7250 Waverley
7140 Wayatinah
7304 Weegena
7304 Weetah
7264 Weldborough
7054 Wellington Park
7307 Wesley Vale
7000 West Hobart
7306 West Kentish
7250 West Launceston
7330 West Montagu
7009 West Moonah
7321 West Mooreville
7316 West Pine
7321 West Ridgley
7260 West Scottsdale
7325 West Takone
7315 West Ulverstone
7303 Westbury
7304 Western Creek
7212 Western Junction
7140 Westerway
7292 Westwood
7252 Weymouth
7184 White Beach
7258 White Hills
7120 Whitefoord
7255 Whitemark
7303 Whitemore
7256 Wickham
7030 Wilburville
7310 Wilmot
7321 Wiltshire
7252 Windermere
7255 Wingaroo
7275 Winkleigh
7265 Winnaleah
7320 Wivenhoe
7162 Woodbridge
7120 Woodbury
7120 Woodsdale
7109 Woodstock
7330 Woolnorth
7254 Wyena
7325 Wynyard
7256 Yambacoona
7256 Yarra Creek
7325 Yolla
7120 York Plains
7270 York Town
7249 Youngtown
7469 Zeehan`;

const VIC = `3737 Abbeyard
3067 Abbotsford
3040 Aberfeldie
3825 Aberfeldy
3714 Acheron
3833 Ada
3984 Adams Estate
3352 Addington
3465 Adelaide Lead
3962 Agnes
3336 Aintree
3237 Aire Valley
3231 Aireys Inlet
3851 Airly
3042 Airport West
3424 Albacutya
3021 Albanvale
3206 Albert Park
3971 Alberton
3971 Alberton West
3020 Albion
3714 Alexandra
3350 Alfredton
3823 Allambee
3871 Allambee Reserve
3871 Allambee South
3691 Allans Flat
3277 Allansford
3364 Allendale
3305 Allestree
3465 Alma
3727 Almonds
3979 Almurta
3078 Alphington
3018 Altona
3025 Altona East
3025 Altona Gate
3028 Altona Meadows
3025 Altona North
3249 Alvie
3371 Amherst
3825 Amor
3468 Amphitheatre
3213 Anakie
3715 Ancona
3995 Anderson
3898 Anglers Rest
3230 Anglesea
3549 Annuello
3414 Antwerp
3233 Apollo Bay
3579 Appin
3579 Appin South
3319 Apsley
3409 Arapiles
3377 Ararat
3951 Arawata
3858 Arbuckle
3631 Arcadia
3631 Arcadia South
3475 Archdale
3475 Archdale Junction
3723 Archerton
3995 Archies Creek
3022 Ardeer
3629 Ardmona
3480 Areegra
3523 Argyle
3143 Armadale
3143 Armadale North
3377 Armstrong
3217 Armstrong Creek
3551 Arnold
3551 Arnold West
3099 Arthurs Creek
3936 Arthurs Seat
3364 Ascot
3551 Ascot
3032 Ascot Vale
3442 Ashbourne
3147 Ashburton
3147 Ashwood
3195 Aspendale
3195 Aspendale Gardens
3818 Athlone
3049 Attwood
3393 Aubrey
3123 Auburn
3122 Auburn South
3570 Auchmore
3212 Avalon
3664 Avenel
3467 Avoca
3477 Avon Plains
3034 Avondale Heights
3559 Avonmore
3782 Avonsleigh
3551 Axe Creek
3551 Axedale
3268 Ayrford
3340 Bacchus Marsh
3670 Baddaginnie
3777 Badger Creek
3579 Bael Bael
3551 Bagshot
3551 Bagshot North
3312 Bahgallah
3608 Bailieston
3875 Bairnsdale
3350 Bakery Hill
3183 Balaclava
3364 Bald Hills
3249 Balintore
3342 Ballan
3279 Ballangeich
3483 Ballapur
3350 Ballarat
3350 Ballarat Central
3350 Ballarat East
3350 Ballarat North
3350 Ballarat West
3561 Ballendella
3340 Balliang
3340 Balliang East
3375 Ballyrogan
3666 Balmattum
3407 Balmoral
3926 Balnarring
3926 Balnarring Beach
3971 Balook
3103 Balwyn
3103 Balwyn East
3104 Balwyn North
3561 Bamawm
3564 Bamawm Extension
3241 Bambra
3333 Bamganie
3691 Bandiana
3393 Bangerang
3175 Bangholme
3875 Banksia Peninsula
3549 Bannerton
3331 Bannockburn
3485 Banyan
3388 Banyena
3084 Banyule
3691 Baranduda
3220 Bareena
3444 Barfold
3463 Baringhup
3463 Baringhup West
3723 Barjarg
3451 Barkers Creek
3384 Barkly
3364 Barkstead
3639 Barmah
3557 Barnadown
3688 Barnawartha
3691 Barnawartha North
3871 Baromi
3249 Barongarook
3249 Barongarook West
3221 Barrabool
3525 Barrakee
3249 Barramunga
3537 Barraport
3537 Barraport West
3458 Barrys Reef
3329 Barunah Park
3329 Barunah Plains
3737 Barwidgee
3722 Barwite
3243 Barwon Downs
3227 Barwon Heads
3460 Basalt
3991 Bass
3213 Batesford
3730 Bathumi
3058 Batman
3833 Baw Baw
3833 Baw Baw Village
3911 Baxter
3375 Bayindeen
3981 Bayles
3444 Baynton
3444 Baynton East
3153 Bayswater
3153 Bayswater North
3807 Beaconsfield
3808 Beaconsfield Upper
3475 Bealiba
3641 Bearii
3517 Bears Lagoon
3579 Beauchamp
3373 Beaufort
3193 Beaumaris
3477 Beazleys Bridge
3135 Bedford Road
3251 Beeac
3237 Beech Forest
3747 Beechworth
3139 Beenak
3160 Belgrave
3160 Belgrave Heights
3160 Belgrave South
3215 Bell Park
3215 Bell Post Hill
3223 Bellarine
3889 Bellbird Creek
3228 Bellbrae
3691 Bellbridge
3381 Bellellen
3081 Bellfield
3381 Bellfield
3228 Bells Beach
3216 Belmont
3889 Bemm River
3946 Bena
3672 Benalla
3900 Benambra
3319 Benayeo
3097 Bend Of Islands
3550 Bendigo
3551 Bendigo Forward
3550 Bendigo South
3888 Bendoc
3875 Bengworden
3579 Benjeroop
3435 Benloch
3125 Bennettswood
3960 Bennison
3204 Bentleigh
3165 Bentleigh East
3235 Benwerrin
3342 Beremboke
3518 Berrimal
3351 Berringa
3691 Berringama
3531 Berriwillock
3323 Berrybank
3953 Berrys Creek
3806 Berwick
3304 Bessiebelle
3472 Bet Bet
3888 Bete Bolong
3888 Bete Bolong North
3691 Bethanga
3472 Betley
3395 Beulah
3590 Beverford
3753 Beveridge
3490 Big Desert
3231 Big Hill
3555 Big Hill
3799 Big Pats Creek
3707 Biggara
3858 Billabong
3533 Bimbourie
3896 Bindi
3966 Binginwarri
3898 Bingo Munjie
3483 Birchip
3483 Birchip West
3505 Birdwoodton
3242 Birregurra
3918 Bittern
3350 Black Hill
3381 Black Range
3193 Black Rock
3193 Black Rock North
3130 Blackburn
3130 Blackburn North
3130 Blackburn South
3401 Blackheath
3844 Blackwarry
3458 Blackwood
3992 Blackwood Forest
3942 Blairgowrie
3342 Blakeville
3364 Blampied
3980 Blind Bight
3352 Blowhard
3351 Bo Peep
3678 Bobinawarrah
3301 Bochara
3699 Bogong
3669 Boho
3669 Boho South
3531 Boigbeat
3490 Boinka
3860 Boisdale
3387 Bolangum
3432 Bolinda
3546 Bolton
3305 Bolwarra
3352 Bolwarrah
3820 Bona Vista
3888 Bonang
3196 Bonbeach
3691 Bonegilla
3939 Boneo
3561 Bonn
3335 Bonnie Brook
3720 Bonnie Doon
3352 Bonshaw
3260 Bookaar
3825 Boola
3960 Boolarong
3870 Boolarra
3870 Boolarra South
3880 Boole Poole
3392 Boolite
3728 Boomahnoomoonah
3235 Boonah
3163 Booran Road Po
3265 Boorcan
3678 Boorhaman
3678 Boorhaman East
3685 Boorhaman North
3723 Boorolite
3953 Boorool
3537 Boort
3730 Boosey
3682 Boralma
3379 Bornes Hill
3155 Boronia
3518 Borung
3260 Bostocks Creek
3977 Botanic Ridge
3599 Boundary Bend
3465 Bowenvale
3675 Boweya
3675 Boweya North
3735 Bowmans Forest
3678 Bowser
3128 Box Hill
3129 Box Hill North
3128 Box Hill South
3725 Boxwood
3463 Bradford
3361 Bradvale
3195 Braeside
3631 Branditt
3150 Brandon Park
3821 Brandy Creek
3302 Branxholme
3821 Bravington
3019 Braybrook
3303 Breakaway Creek
3219 Breakwater
3227 Breamlea
3517 Brenanah
3131 Brentford Square
3352 Brewster
3860 Briagolong
3088 Briar Hill
3723 Bridge Creek
3516 Bridgewater
3516 Bridgewater North
3516 Bridgewater On Loddon
3741 Bright
3186 Brighton
3187 Brighton East
3186 Brighton North
3184 Brighton Road
3391 Brim
3312 Brimboal
3685 Brimin
3401 Brimpaen
3319 Bringalbert
3315 Brit Brit
3658 Broadford
3875 Broadlands
3047 Broadmeadows
3301 Broadwater
3888 Brodribb River
3673 Broken Creek
3472 Bromley
3338 Brookfield
3012 Brooklyn
3896 Brookville
3364 Broomfield
3418 Broughton
3350 Brown Hill
3685 Browns Plains
3749 Bruarong
3268 Brucknell
3885 Brumby
3056 Brunswick
3057 Brunswick East
3056 Brunswick Lower
3056 Brunswick North
3055 Brunswick South
3055 Brunswick West
3885 Bruthen
3375 Buangor
3885 Buchan
3885 Buchan South
3740 Buckland
3240 Buckley
3301 Buckley Swamp
3525 Buckrabanyule
3862 Budgee Budgee
3870 Budgeree
3579 Budgerum East
3958 Buffalo
3737 Buffalo River
3314 Bulart
3890 Buldah
3586 Bulga
3377 Bulgana
3428 Bulla
3266 Bullaharre
3352 Bullarook
3461 Bullarto
3461 Bullarto South
3105 Bulleen
3437 Bullengarook
3700 Bullioh
3875 Bullumwaal
3821 Buln Buln
3821 Buln Buln East
3902 Bumberrah
3634 Bunbartha
3851 Bundalaguah
3730 Bundalong
3730 Bundalong South
3898 Bundara
3342 Bunding
3083 Bundoora
3465 Bung Bong
3260 Bungador
3334 Bungal
3401 Bungalally
3352 Bungaree
3726 Bungeet
3726 Bungeet West
3691 Bungil
3527 Bunguluke
3357 Buninyong
3352 Bunkers Hill
3815 Bunyip
3815 Bunyip North
3858 Buragwonduc
3568 Burkes Bridge
3475 Burkes Flat
3371 Burnbank
3558 Burnewang
3121 Burnley
3121 Burnley North
3023 Burnside
3023 Burnside Heights
3559 Burramboot
3730 Burramine
3730 Burramine South
3709 Burrowye
3352 Burrumbeet
3125 Burwood
3151 Burwood East
3151 Burwood Heights
3281 Bushfield
3860 Bushy Park
3885 Butchers Ridge
3711 Buxton
3301 Byaduk
3300 Byaduk North
3678 Byawatha
3762 Bylands
3617 Byrneside
3505 Cabarita
3364 Cabbage Tree
3889 Cabbage Tree Creek
3442 Cadello
3023 Cairnlea
3037 Calder Park
3984 Caldermeade
3556 California Gully
3573 Calivil
3387 Callawadda
3844 Callignee
3844 Callignee North
3844 Callignee South
3971 Calrossie
3875 Calulu
3779 Cambarville
3124 Camberwell
3126 Camberwell East
3124 Camberwell North
3124 Camberwell South
3124 Camberwell West
3352 Cambrian Hill
3061 Campbellfield
3387 Campbells Bridge
3451 Campbells Creek
3556 Campbells Forest
3364 Campbelltown
3260 Camperdown
3350 Canadian
3537 Canary Island
3630 Caniambo
3890 Cann River
3540 Cannie
3977 Cannons Creek
3393 Cannum
3126 Canterbury
3305 Cape Bridgewater
3351 Cape Clear
3888 Cape Conran
3233 Cape Otway
3995 Cape Paterson
3939 Cape Schanck
3925 Cape Woolamai
3940 Capel Sound
3579 Capels Crossing
3623 Carag Carag
3371 Caralulup
3274 Caramut
3477 Carapooee
3477 Carapooee West
3312 Carapook
3678 Carboor
3352 Cardigan
3352 Cardigan Village
3978 Cardinia
3496 Cardross
3334 Cargerie
3512 Carina
3825 Caringal
3464 Carisbrook
3239 Carlisle River
3442 Carlsruhe
3053 Carlton
3054 Carlton North
3053 Carlton South
3685 Carlyle
3163 Carnegie
3351 Carngham
3023 Caroline Springs
3260 Carpendeit
3844 Carrajung
3844 Carrajung Lower
3844 Carrajung South
3361 Carranballac
3480 Carron
3197 Carrum
3201 Carrum Downs
3494 Carwarp
3305 Cashmore
3898 Cassilis
3777 Castella
3311 Casterton
3691 Castle Creek
3585 Castle Donnington
3450 Castlemaine
3981 Catani
3377 Cathcart
3714 Cathkin
3537 Catumnal
3162 Caulfield
3145 Caulfield East
3161 Caulfield Junction
3161 Caulfield North
3162 Caulfield South
3660 Caveat
3314 Cavendish
3145 Central Park
3221 Ceres
3148 Chadstone
3148 Chadstone Centre
3890 Chandlers Creek
3352 Chapel Flat
3239 Chapple Vale
3318 Charam
3217 Charlemont
3695 Charleroi
3525 Charlton
3379 Chatsworth
3196 Chelsea
3196 Chelsea Heights
3192 Cheltenham
3192 Cheltenham East
3351 Chepstowe
3434 Cherokee
3401 Cherrypool
3678 Cheshunt
3678 Cheshunt South
3725 Chesney Vale
3312 Chetwynd
3451 Chewton
3451 Chewton Bushlands
3824 Childers
3585 Chillingollah
3683 Chiltern
3683 Chiltern Valley
3544 Chinangin
3546 Chinkapook
3756 Chintin
3116 Chirnside Park
3525 Chirrip
3260 Chocolyn
3775 Christmas Hills
3777 Chum Creek
3842 Churchill
3925 Churchill Island
3373 Chute
3352 Clarendon
3352 Claretown
3169 Clarinda
3430 Clarkefield
3352 Clarkes Hill
3168 Clayton
3169 Clayton South
3409 Clear Lake
3782 Clematis
3875 Clifton Creek
3068 Clifton Hill
3222 Clifton Springs
3658 Clonbinane
3315 Clover Flat
3822 Cloverlea
3889 Club Terrace
3370 Clunes
3978 Clyde
3978 Clyde North
3851 Clydebank
3461 Clydesdale
3825 Coalville
3851 Cobains
3442 Cobaw
3862 Cobbannah
3900 Cobberas
3338 Cobblebank
3266 Cobden
3644 Cobram
3644 Cobram East
3266 Cobrico
3898 Cobungra
3058 Coburg
3058 Coburg North
3546 Cocamba
3475 Cochranes Creek
3781 Cockatoo
3030 Cocoroc
3285 Codrington
3364 Coghills Creek
3568 Cohuna
3340 Coimadai
3542 Cokum
3250 Colac
3707 Colac Colac
3250 Colac East
3250 Colac West
3559 Colbinabbin
3342 Colbrook
3770 Coldstream
3315 Coleraine
3494 Colignan
3066 Collingwood
3066 Collingwood North
3630 Colliver
3889 Combienbar
3384 Concongella
3303 Condah
3286 Condah Swamp
3633 Congupna
3227 Connewarre
3318 Connewirricoo
3315 Coojar
3048 Coolaroo
3616 Cooma
3629 Coomboona
3461 Coomoora
3860 Coongulla
3477 Coonooer Bridge
3477 Coonooer West
3825 Coopers Creek
3268 Cooriemungle
3480 Cope Cope
3814 Cora Lynn
3480 Corack
3480 Corack East
3249 Coragulac
3691 Coral Bank
3352 Corindhap
3984 Corinella
3214 Corio
3311 Corndale
3551 Cornella
3683 Cornishtown
3984 Coronet Bay
3559 Corop
3558 Corop West
3254 Cororooke
3888 Corringle
3707 Corryong
3249 Corunnun
3631 Cosgrove
3631 Cosgrove South
3523 Costerfield
3101 Cotham
3465 Cotswold
3099 Cottles Bridge
3862 Cowa
3506 Cowangie
3922 Cowes
3268 Cowleys Creek
3857 Cowwarr
3465 Craigie
3064 Craigieburn
3977 Cranbourne
3977 Cranbourne East
3977 Cranbourne North
3977 Cranbourne South
3977 Cranbourne West
3669 Creek Junction
3551 Creek View
3666 Creightons Creek
3121 Cremorne
3322 Cressy
3363 Creswick
3363 Creswick North
3919 Crib Point
3193 Cromer
3858 Crookayan
3862 Crooked River
3041 Cross Keys
3373 Cross Roads
3283 Crossley
3821 Crossover
3377 Crowlands
3301 Croxton East
3136 Croydon
3136 Croydon Hills
3136 Croydon North
3136 Croydon South
3393 Crymelon
3714 Crystal Creek
3265 Cudgee
3705 Cudgewa
3530 Culgoa
3315 Culla
3568 Cullen
3496 Cullulleraine
3251 Cundare
3251 Cundare North
3268 Curdies River
3268 Curdievale
3222 Curlewis
3483 Curyo
3385 Dadswells Bridge
3465 Daisy Hill
3341 Dales Creek
3047 Dallas
3981 Dalmore
3568 Daltons Bridge
3477 Dalyenong
3992 Dalyston
3175 Dandenong
3175 Dandenong East
3175 Dandenong North
3175 Dandenong South
3737 Dandongadale
3862 Dargo
3340 Darley
3871 Darlimurla
3145 Darling
3145 Darling South
3271 Darlington
3822 Darnum
3756 Darraweit Guim
3851 Darriman
3304 Dartmoor
3701 Dartmouth
3858 Dawson
3460 Daylesford
3363 Dean
3235 Deans Marsh
3336 Deanside
3888 Deddick Valley
3691 Dederang
3385 Deep Lead
3103 Deepdene
3023 Deer Park
3022 Deer Park East
3023 Deer Park North
3356 Delacombe
3037 Delahey
3723 Delatite
3871 Delburn
3888 Delegate River
3186 Dendy
3377 Denicull Creek
3858 Denison
3280 Dennington
3461 Denver
3875 Deptford
3516 Derby
3352 Dereel
3312 Dergholm
3026 Derrimut
3523 Derrinal
3325 Derrinallum
3726 Devenish
3714 Devils River
3977 Devon Meadows
3971 Devon North
3808 Dewhurst
3610 Dhurringile
3089 Diamond Creek
3309 Digby
3427 Diggers Rest
3561 Diggora
3414 Dimboola
3571 Dingee
3172 Dingley Village
3579 Dingwall
3898 Dinner Plain
3265 Dixie
3775 Dixons Creek
3377 Dobie
3678 Docker
3678 Dockers Plains
3008 Docklands
3895 Doctors Flat
3871 Dollar
3139 Don Valley
3480 Donald
3108 Doncaster
3109 Doncaster East
3109 Doncaster Heights
3064 Donnybrook
3111 Donvale
3478 Dooboobetic
3401 Dooen
3646 Dookie
3647 Dookie College
3754 Doreen
3312 Dorodong
3893 Double Bridges
3409 Douglas
3177 Doveton
3249 Dreeite
3249 Dreeite South
3840 Driffield
3304 Drik Drik
3936 Dromana
3660 Dropmore
3818 Drouin
3818 Drouin East
3818 Drouin South
3818 Drouin West
3636 Drumanure
3304 Drumborg
3215 Drumcondra
3570 Drummartin
3461 Drummond
3446 Drummond North
3401 Drung
3461 Dry Diggings
3222 Drysdale
3409 Duchembegarra
3956 Dumbalk
3956 Dumbalk North
3527 Dumosa
3371 Dunach
3271 Dundonnell
3175 Dunearn
3294 Dunkeld
3630 Dunkirk
3472 Dunluce
3377 Dunneworthy
3352 Dunnstown
3472 Dunolly
3312 Dunrobin
3342 Durdidwarrah
3352 Durham Lead
3576 Durham Ox
3851 Dutson
3851 Dutson Downs
3305 Dutton Way
3323 Duverney
3878 Eagle Point
3556 Eaglehawk
3556 Eaglehawk North
3084 Eaglemont
3669 Earlston
3875 East Bairnsdale
3550 East Bendigo
3219 East Geelong
3002 East Melbourne
3852 East Sale
3678 East Wangaratta
3799 East Warburton
3231 Eastern View
3463 Eastville
3875 Eastwood
3691 Ebden
3564 Echuca
3564 Echuca South
3564 Echuca Village
3564 Echuca West
3265 Ecklin South
3472 Eddington
3757 Eden Park
3318 Edenhope
3444 Edgecombe
3678 Edi
3678 Edi Upper
3196 Edithvale
3461 Eganstown
3713 Eildon
3334 Elaine
3746 Eldorado
3461 Elevated Plains
3266 Elingamite
3266 Elingamite North
3921 Elizabeth Island
3875 Ellaswood
3265 Ellerslie
3250 Elliminyt
3821 Ellinbank
3469 Elmhurst
3558 Elmore
3448 Elphinstone
3185 Elsternwick
3095 Eltham
3095 Eltham North
3184 Elwood
3782 Emerald
3475 Emu
3551 Emu Creek
3802 Endeavour Hills
3352 Enfield
3407 Englefield
3723 Enochs Point
3895 Ensay
3895 Ensay North
3551 Eppalock
3076 Epping
3551 Epsom
3352 Ercildoune
3825 Erica
3889 Errinundra
3701 Eskdale
3730 Esmond
3040 Essendon
3041 Essendon Fields
3041 Essendon North
3040 Essendon West
3177 Eumemmerring
3251 Eurack
3350 Eureka
3666 Euroa
3739 Eurobin
3371 Evansford
3377 Eversley
3678 Everton
3678 Everton Upper
3338 Exford
3338 Eynesbury
3951 Fairbank
3078 Fairfield
3231 Fairhaven
3579 Fairley
3561 Fairy Dell
3875 Fairy Dell
3699 Falls Creek
3451 Faraday
3714 Fawcett
3060 Fawkner
3518 Fentons Creek
3237 Ferguson
3458 Fern Hill
3864 Fernbank
3821 Ferndale
3518 Fernihurst
3778 Fernshaw
3156 Ferntree Gully
3786 Ferny Creek
3024 Fieldstone
3518 Fiery Flat
3939 Fingal
3959 Fish Creek
3585 Fish Point
3342 Fiskville
3065 Fitzroy
3068 Fitzroy North
3875 Flaggy Creek
3465 Flagstaff
3851 Flamingo Beach
3031 Flemington
3929 Flinders
3550 Flora Hill
3717 Flowerdale
3844 Flynn
3844 Flynns Creek
3011 Footscray
3764 Forbes
3131 Forest Hill
3875 Forge Creek
3236 Forrest
3960 Foster
3960 Foster North
3557 Fosterville
3805 Fountain Gate
3323 Foxhow
3265 Framlingham
3265 Framlingham East
3461 Franklinford
3199 Frankston
3199 Frankston East
3199 Frankston Heights
3200 Frankston North
3199 Frankston South
3336 Fraser Rise
3741 Freeburgh
3921 French Island
3384 Frenchmans
3217 Freshwater Creek
3451 Fryerstown
3851 Fulham
3825 Fumina
3825 Fumina South
3381 Fyans Creek
3218 Fyansford
3723 Gaffneys Creek
3822 Gainsborough
3568 Gannawarra
3737 Gapsted
3207 Garden City
3185 Gardenvale
3814 Garfield
3814 Garfield North
3352 Garibaldi
3265 Garvoc
3691 Gateway Island
3407 Gatum
3289 Gazette
3220 Geelong
3221 Geelong Mc
3215 Geelong North
3218 Geelong West
3885 Gelantipy
3239 Gellibrand
3237 Gellibrand Lower
3971 Gelliondale
3783 Gembrook
3891 Genoa
3833 Gentle Annie
3700 Georges Creek
3546 Gerahmin
3418 Gerang Gerung
3249 Gerangamete
3387 Germania
3741 Germantown
3289 Gerrigerrup
3240 Gherang
3331 Gheringhap
3717 Ghin Ghin
3851 Giffard
3851 Giffard West
3480 Gil Gil
3072 Gilberton
3797 Gilderoy
3616 Gillieston
3858 Gillum
3891 Gipsy Point
3624 Girgarre
3616 Girgarre East
3437 Gisborne
3437 Gisborne South
3575 Gladfield
3043 Gladstone Park
3797 Gladysdale
3979 Glen Alvie
3691 Glen Creek
3990 Glen Forbes
3163 Glen Huntly
3146 Glen Iris
3352 Glen Park
3898 Glen Valley
3150 Glen Waverley
3898 Glen Wills
3238 Glenaire
3864 Glenaladale
3517 Glenalbyn
3764 Glenaroua
3352 Glenbrae
3717 Glenburn
3363 Glendaruel
3364 Glendonald
3858 Glenfalloch
3122 Glenferrie South
3266 Glenfyne
3020 Glengala
3854 Glengarry
3854 Glengarry North
3854 Glengarry West
3370 Glengower
3444 Glenhope
3522 Glenhope East
3314 Glenisla
3418 Glenlee
3469 Glenlofty
3469 Glenlogie
3527 Glenloth
3527 Glenloth East
3451 Glenluce
3461 Glenlyon
3858 Glenmaggie
3340 Glenmore
3385 Glenorchy
3265 Glenormiston
3265 Glenormiston North
3265 Glenormiston South
3469 Glenpatrick
3675 Glenrowan
3675 Glenrowan West
3046 Glenroy
3293 Glenthompson
3851 Glomar Beach
3221 Gnarwarre
3260 Gnotuk
3559 Gobarup
3719 Gobur
3851 Golden Beach
3555 Golden Gully
3350 Golden Point
3451 Golden Point
3465 Golden Point
3555 Golden Square
3435 Goldie
3472 Goldsborough
3352 Gong Gong
3579 Gonn Crossing
3673 Goomalibee
3875 Goon Nure
3888 Goongerah
3666 Gooram
3685 Gooramadda
3725 Goorambat
3557 Goornong
3477 Gooroc
3305 Gorae
3305 Gorae West
3345 Gordon
3873 Gormandale
3412 Goroke
3585 Goschen
3723 Goughs Bay
3608 Goulburn Weir
3043 Gowanbrae
3544 Gowanford
3669 Gowangardie
3477 Gowar East
3463 Gower
3631 Grahamvale
3314 Grampians
3870 Grand Ridge
3335 Grangefields
3525 Granite Flat
3875 Granite Rock
3984 Grantville
3701 Granya
3409 Grass Flat
3302 Grassdale
3281 Grassmere
3477 Grays Bridge
3608 Graytown
3477 Gre Gre
3477 Gre Gre North
3477 Gre Gre South
3685 Great Southern
3374 Great Western
3537 Gredgwin
3462 Green Gully
3341 Greendale
3444 Greenhill
3387 Greens Creek
3088 Greensborough
3059 Greenvale
3304 Greenwald
3352 Grenville
3675 Greta
3675 Greta South
3675 Greta West
3234 Grey River
3104 Greythorn
3315 Gringegalgona
3315 Gritjurk
3216 Grovedale
3216 Grovedale East
3770 Gruyere
3451 Guildford
3566 Gunbower
3691 Gundowring
3960 Gunyah
3709 Guys Forest
3807 Guys Hill
3401 Gymbowen
3351 Haddon
3046 Hadfield
3803 Hallam
3818 Hallora
3381 Halls Gap
3953 Hallston
3300 Hamilton
3215 Hamlyn Heights
3188 Hampton
3188 Hampton East
3188 Hampton North
3976 Hampton Park
3675 Hansonville
3360 Happy Valley
3549 Happy Valley
3453 Harcourt
3453 Harcourt North
3806 Harkaway
3337 Harkness
3995 Harmers Haven
3741 Harrietville
3317 Harrow
3616 Harston
3124 Hartwell
3915 Hastings
3501 Hattah
3465 Havelock
3401 Haven
3737 Havilah
3287 Hawkesdale
3862 Hawkhurst
3142 Hawksburn
3122 Hawthorn
3123 Hawthorn East
3122 Hawthorn North
3122 Hawthorn West
3888 Haydens Bog
3966 Hazel Park
3658 Hazeldene
3840 Hazelwood
3840 Hazelwood North
3840 Hazelwood South
3777 Healesville
3777 Healesville Main Street
3981 Heath Hill
3523 Heathcote
3758 Heathcote Junction
3523 Heathcote South
3202 Heatherton
3305 Heathmere
3135 Heathmont
3134 Heathwood
3967 Hedley
3084 Heidelberg
3081 Heidelberg Heights
3081 Heidelberg Rgh
3081 Heidelberg West
3301 Hensley Park
3312 Henty
3461 Hepburn
3461 Hepburn Springs
3218 Herne Hill
3825 Hernes Oak
3442 Hesket
3321 Hesse
3273 Hexham
3858 Heyfield
3268 Heytesbury Lower
3304 Heywood
3847 Hiamdale
3971 Hiawatha
3764 High Camp
3190 Highett
3660 Highlands
3032 Highpoint City
3216 Highton
3315 Hilgay
3825 Hill End
3351 Hillcrest
3660 Hilldene
3037 Hillside
3875 Hillside
3898 Hinnomunjie
3920 Hmas Cerberus
3139 Hoddles Creek
3862 Hollands Landing
3148 Holmesglen
3465 Homebush
3304 Homerton
3717 Homewood
3396 Hopetoun
3162 Hopetoun Gardens
3340 Hopetoun Park
3029 Hoppers Crossing
3238 Hordern Vale
3567 Horfield
3400 Horsham
3741 Hotham Heights
3051 Hotham Hill
3303 Hotspur
3128 Houston
3723 Howes Creek
3858 Howitt Plains
3723 Howqua
3723 Howqua Hills
3723 Howqua Inlet
3166 Hughesdale
3757 Humevale
3558 Hunter
3971 Hunterston
3166 Huntingdale
3551 Huntly
3551 Huntly North
3695 Huon
3691 Huon Creek
3099 Hurstbridge
3833 Icy Creek
3875 Iguana Creek
3351 Illabarook
3381 Illawarra
3282 Illowa
3223 Indented Head
3688 Indigo Valley
3517 Inglewood
3342 Ingliston
3472 Inkerman
3636 Invergordon
3321 Inverleigh
3996 Inverloch
3352 Invermay
3350 Invermay Park
3815 Iona
3494 Iraak
3451 Irishtown
3550 Ironbark
3249 Irrewarra
3249 Irrewillipe
3249 Irrewillipe East
3498 Irymple
3079 Ivanhoe
3079 Ivanhoe East
3079 Ivanhoe North
3047 Jacana
3971 Jack River
3556 Jackass Flat
3825 Jacob Creek
3984 Jam Jerrup
3723 Jamieson
3228 Jan Juc
3266 Jancourt
3266 Jancourt East
3517 Jarklin
3888 Jarrahmond
3700 Jarvis Creek
3840 Jeeralang
3840 Jeeralang Junction
3945 Jeetho
3480 Jeffcott
3480 Jeffcott North
3423 Jeparit
3825 Jericho
3527 Jeruk
3483 Jil Jil
3409 Jilpanger
3818 Jindivick
3384 Joel Joel
3384 Joel South
3238 Johanna
3902 Johnsonville
3870 Johnstones Hill
3148 Jordanville
3364 Joyces Creek
3869 Jumbuk
3951 Jumbunna
3977 Junction Village
3401 Jung
3575 Jungaburra
3551 Junortoun
3635 Kaarimba
3318 Kadnook
3909 Kalimna
3909 Kalimna West
3064 Kalkallo
3401 Kalkee
3791 Kallista
3766 Kalorama
3529 Kalpienung
3570 Kamarooka
3571 Kamarooka North
3401 Kanagulk
3691 Kancoona
3555 Kangaroo Flat
3097 Kangaroo Ground
3419 Kaniva
3719 Kanumbra
3387 Kanya
3564 Kanyapella
3294 Karabeal
3951 Kardella
3950 Kardella South
3260 Kariah
3199 Karingal
3199 Karingal Centre
3401 Karnak
3631 Karramomus
3483 Karyrie
3649 Katamatite
3649 Katamatite East
3634 Katandra
3634 Katandra West
3640 Katunga
3249 Kawarren
3021 Kealba
3568 Keely
3036 Keilor
3038 Keilor Downs
3033 Keilor East
3038 Keilor Lodge
3036 Keilor North
3042 Keilor Park
3393 Kellalac
3666 Kelvin View
3597 Kenley
3395 Kenmare
3239 Kennedys Creek
3234 Kennett River
3550 Kennington
3031 Kensington
3579 Kerang
3579 Kerang East
3691 Kergunyah
3691 Kergunyah South
3979 Kernot
3434 Kerrie
3129 Kerrimuir
3660 Kerrisdale
3723 Kevington
3101 Kew
3102 Kew East
3390 Kewell
3173 Keysborough
3631 Kialla
3631 Kialla East
3631 Kialla West
3418 Kiata
3691 Kiewa
3995 Kilcunda
3312 Killara
3691 Killara
3283 Killarney
3678 Killawarra
3717 Killingworth
3851 Kilmany
3764 Kilmore
3764 Kilmore East
3137 Kilsyth
3137 Kilsyth South
3551 Kimbolton
3678 King Valley
3763 Kinglake
3757 Kinglake Central
3757 Kinglake West
3517 Kingower
3021 Kings Park
3083 Kingsbury
3364 Kingston
3012 Kingsville
3483 Kinnabulla
3520 Kinypanial
3283 Kirkstall
3608 Kirwans Bridge
3666 Kithbrook
3286 Knebsworth
3723 Knockwood
3523 Knowsley
3152 Knox City Centre
3180 Knoxfield
3260 Koallah
3704 Koetong
3265 Kolora
3951 Kongwak
3315 Konongwootong
3981 Koo Wee Rup
3981 Koo Wee Rup North
3597 Kooloonong
3669 Koonda
3580 Koondrook
3644 Koonoomoo
3954 Koonwarra
3477 Kooreh
3501 Koorlong
3844 Koornalla
3364 Kooroocheang
3860 Koorool
3953 Koorooman
3144 Kooyong
3714 Koriella
3341 Korobeit
3282 Koroit
3520 Korong Vale
3579 Koroop
3950 Korumburra
3950 Korumburra South
3461 Korweinguboora
3565 Kotta
3638 Kotupna
3622 Koyuga
3945 Krowera
3490 Kulwin
3585 Kunat
3930 Kunyung
3518 Kurraca
3518 Kurraca West
3517 Kurting
3337 Kurunjang
3620 Kyabram
3620 Kyabram South
3444 Kyneton
3444 Kyneton South
3621 Kyvalley
3083 La Trobe University
3463 Laanecoorie
3265 Laang
3816 Labertouche
3130 Laburnum
3678 Laceby
3523 Ladys Pass
3480 Laen
3480 Laen East
3480 Laen North
3393 Lah
3401 Laharum
3584 Lake Boga
3351 Lake Bolac
3909 Lake Bunga
3581 Lake Charm
3303 Lake Condah
3713 Lake Eildon
3551 Lake Eppalock
3381 Lake Fyans
3355 Lake Gardens
3373 Lake Goldsmith
3381 Lake Lonsdale
3525 Lake Marmal
3579 Lake Meran
3312 Lake Mundi
3597 Lake Powell
3727 Lake Rowan
3887 Lake Tyers
3909 Lake Tyers Beach
3533 Lake Tyrrell
3851 Lake Wellington
3350 Lake Wendouree
3373 Lake Wongan
3909 Lakes Entrance
3352 Lal Lal
3542 Lalbert
3075 Lalor
3352 Lamplough
3620 Lancaster
3995 Lance Creek
3435 Lancefield
3384 Landsborough
3384 Landsborough West
3984 Lang Lang
3984 Lang Lang East
3363 Langdons Hill
3352 Langi Kal Kal
3377 Langi Logan
3318 Langkoop
3444 Langley
3971 Langsborough
3910 Langwarrin
3911 Langwarrin South
3555 Lansell Plaza
3212 Lara
3821 Lardner
3249 Larpent
3325 Larralea
3487 Lascelles
3139 Launching Place
3444 Lauriston
3238 Lavers Hill
3028 Laverton
3026 Laverton North
3480 Lawler
3418 Lawloit
3364 Lawrence
3537 Leaghur
3352 Learmonth
3385 Ledcourt
3516 Leichardt
3352 Leigh Creek
3567 Leitchville
3631 Lemnos
3691 Leneva
3461 Leonards Hill
3953 Leongatha
3953 Leongatha North
3953 Leongatha South
3224 Leopold
3458 Lerderderg
3260 Leslie Manor
3332 Lethbridge
3352 Lexton
3858 Licola
3858 Licola North
3820 Lillico
3371 Lillicur
3420 Lillimur
3682 Lilliput
3140 Lilydale
3673 Lima
3673 Lima East
3673 Lima South
3717 Limestone
3865 Lindenow
3875 Lindenow South
3312 Lindsay
3496 Lindsay Point
3509 Linga
3360 Linton
3549 Liparoo
3324 Lismore
3480 Litchfield
3418 Little Desert
3458 Little Hampton
3211 Little River
3551 Llanelly
3862 Llowalong
3945 Loch
3851 Loch Sport
3833 Loch Valley
3563 Lockington
3665 Locksley
3551 Lockwood
3551 Lockwood South
3575 Loddon Vale
3475 Logan
3678 Londrigan
3340 Long Forest
3550 Long Gully
3401 Longerenong
3851 Longford
3551 Longlea
3816 Longwarry
3816 Longwarry North
3665 Longwood
3666 Longwood East
3232 Lorne
3418 Lorquon
3213 Lovely Banks
3639 Lower Moira
3401 Lower Norton
3093 Lower Plenty
3844 Loy Yang
3385 Lubeck
3350 Lucas
3875 Lucknow
3691 Lucyvale
3673 Lurg
3444 Lyal
3975 Lynbrook
3975 Lyndhurst
3304 Lyons
3461 Lyonville
3156 Lysterfield
3156 Lysterfield South
3286 Macarthur
3782 Macclesfield
3440 Macedon
3971 Macks Creek
3085 Macleod
3085 Macleod West
3579 Macorna
3568 Macorna North
3723 Macs Cove
3971 Madalya
3340 Maddingley
3379 Mafeking
3860 Maffra
3859 Maffra West Upper
3352 Magpie
3551 Maiden Gully
3012 Maidstone
3275 Mailors Flat
3373 Main Lead
3928 Main Ridge
3723 Maindample
3714 Maintongoon
3725 Major Plains
3465 Majorca
3463 Maldon
3892 Mallacoota
3446 Malmsbury
3144 Malvern
3145 Malvern East
3144 Malvern North
3024 Mambourin
3546 Manangatang
3551 Mandurang
3551 Mandurang South
3663 Mangalore
3218 Manifold Heights
3222 Mannerim
3360 Mannibadar
3971 Manns Beach
3024 Manor Lakes
3889 Manorina
3722 Mansfield
3891 Maramingo Creek
3222 Marcus Hill
3953 Mardan
3233 Marengo
3032 Maribyrnong
3634 Marionvale
3678 Markwood
3483 Marlbed
3888 Marlo
3387 Marnoo
3477 Marnoo East
3387 Marnoo West
3515 Marong
3377 Maroona
3669 Marraweeney
3216 Marshall
3875 Marthavale
3634 Marungi
3465 Maryborough
3812 Maryknoll
3779 Marysville
3840 Maryvale
3482 Massey
3723 Matlock
3331 Maude
3938 McCrae
3472 McIntyre
3401 McKenzie Creek
3451 McKenzie Hill
3204 McKinnon
3874 McLoughlins Beach
3799 McMahons Creek
3568 McMillans
3568 Mead
3678 Meadow Creek
3048 Meadow Heights
3585 Meatian
3478 Medlyn
3956 Meeniyan
3579 Meering West
3862 Meerlieu
3000 Melbourne
3004 Melbourne
3045 Melbourne Airport
3052 Melbourne University
3337 Melton
3338 Melton South
3337 Melton West
3315 Melville Forest
3875 Melwood
3373 Mena Park
3194 Mentone
3194 Mentone East
3159 Menzies Creek
3277 Mepunga
3277 Mepunga East
3277 Mepunga West
3505 Merbein
3505 Merbein South
3505 Merbein West
3333 Meredith
3496 Meringur
3310 Merino
3058 Merlynston
3754 Mernda
3737 Merriang
3737 Merriang South
3916 Merricks
3926 Merricks Beach
3926 Merricks North
3618 Merrigum
3723 Merrijig
3875 Merrijig
3340 Merrimu
3496 Merrinee
3715 Merton
3448 Metcalfe
3444 Metcalfe East
3904 Metung
3444 Mia Mia
3064 Mickleham
3124 Middle Camberwell
3375 Middle Creek
3206 Middle Park
3956 Middle Tarwin
3666 Miepoll
3409 Miga Lake
3678 Milawa
3500 Mildura
3501 Mildura Centre Plaza
3501 Mildura South
3500 Mildura West
3082 Mill Park
3352 Millbrook
3799 Millgrove
3572 Milloo
3304 Milltown
3579 Milnes Bridge
3575 Mincha
3568 Mincha West
3352 Miners Rest
3324 Mingay
3287 Minhamite
3413 Minimay
3351 Mininera
3276 Minjah
3537 Minmindie
3392 Minyip
3862 Miowera
3596 Miralie
3415 Miram
3871 Mirboo
3871 Mirboo North
3722 Mirimbah
3294 Mirranatwa
3132 Mitcham
3132 Mitcham North
3355 Mitchell Park
3608 Mitchellstown
3573 Mitiamo
3409 Mitre
3701 Mitta Mitta
3490 Mittyack
3401 Mockinya
3816 Modella
3240 Modewarre
3825 Moe
3825 Moe South
3231 Moggs Creek
3666 Moglonemby
3381 Mokepilly
3718 Molesworth
3472 Moliagul
3666 Molka
3352 Mollongghip
3575 Mologa
3673 Molyullah
3793 Monbulk
3433 Monegeetta
3691 Mongans Bridge
3860 Monomak
3984 Monomeith
3127 Mont Albert
3129 Mont Albert North
3851 Montgomery
3094 Montmorency
3765 Montrose
3224 Moolap
3477 Moolerr
3465 Moolort
3478 Moonambel
3825 Moondarra
3039 Moonee Ponds
3055 Moonee Vale
3450 Moonlight Flat
3465 Moonlight Flat
3612 Moora
3189 Moorabbin
3194 Moorabbin Airport
3189 Moorabbin East
3213 Moorabool
3314 Mooralla
3610 Moorilim
3523 Moormbool West
3862 Moornapa
3673 Moorngag
3933 Moorooduc
3138 Mooroolbark
3629 Mooroopna
3629 Mooroopna North
3616 Mooroopna North West
3764 Moranding
3195 Mordialloc
3058 Moreland
3055 Moreland West
3301 Morgiana
3240 Moriac
3931 Mornington
3860 Moroka
3334 Morrisons
3387 Morrl Morrl
3272 Mortlake
3482 Morton Plains
3840 Morwell
3885 Mossiface
3709 Mount Alfred
3699 Mount Beauty
3363 Mount Beckworth
3960 Mount Best
3352 Mount Bolton
3675 Mount Bruno
3740 Mount Buffalo
3723 Mount Buller
3781 Mount Burnett
3324 Mount Bute
3523 Mount Camel
3370 Mount Cameron
3350 Mount Clear
3377 Mount Cole
3377 Mount Cole Creek
3024 Mount Cottrell
3767 Mount Dandenong
3334 Mount Doran
3381 Mount Dryden
3217 Mount Duneed
3953 Mount Eccles
3953 Mount Eccles South
3352 Mount Egerton
3930 Mount Eliza
3351 Mount Emu
3796 Mount Evelyn
3461 Mount Franklin
3371 Mount Glasgow
3350 Mount Helen
3472 Mount Hooghly
3741 Mount Hotham
3468 Mount Lonarch
3441 Mount Macedon
3646 Mount Major
3934 Mount Martha
3352 Mount Mercer
3240 Mount Moriac
3301 Mount Napier
3350 Mount Pleasant
3364 Mount Prospect
3305 Mount Richmond
3352 Mount Rowan
3236 Mount Sabine
3844 Mount Tassie
3875 Mount Taylor
3777 Mount Toolebewong
3342 Mount Wallace
3149 Mount Waverley
3723 Mountain Bay
3156 Mountain Gate
3988 Mountain View
3294 Moutajup
3951 Moyarra
3732 Moyhu
3477 Moyreisk
3377 Moyston
3644 Muckatah
3451 Muckleford
3462 Muckleford South
3737 Mudgegonga
3170 Mulgrave
3304 Mumbannar
3635 Mundoona
3862 Munro
3315 Muntham
3610 Murchison
3610 Murchison East
3610 Murchison North
3218 Murgheboluc
3747 Murmungee
3544 Murnungin
3551 Murphys Creek
3401 Murra Warra
3579 Murrabit
3579 Murrabit West
3586 Murrawee
3490 Murray-Sunset
3586 Murraydale
3512 Murrayville
3885 Murrindal
3717 Murrindindi
3243 Murroon
3163 Murrumbeena
3390 Murtoa
3461 Musk
3461 Musk Vale
3557 Muskerry
3533 Myall
3579 Myall
3304 Myamyn
3556 Myers Flat
3551 Myola
3341 Myrniong
3732 Myrrhee
3551 Myrtle Creek
3851 Myrtlebank
3737 Myrtleford
3518 Mysia
3579 Mystic Park
3641 Mywee
3608 Nagambie
3249 Nalangil
3646 Nalinga
3847 Nambrok
3533 Nandaly
3781 Nangana
3312 Nangeela
3494 Nangiloc
3561 Nanneella
3860 Nap Nap Marra
3352 Napoleons
3812 Nar Nar Goon
3812 Nar Nar Goon North
3778 Narbethong
3293 Nareeb
3315 Nareen
3525 Nareewillock
3707 Nariel Valley
3636 Naring
3277 Naringal
3277 Naringal East
3266 Naroghid
3824 Narracan
3483 Narraport
3293 Narrapumelap South
3285 Narrawong
3805 Narre Warren
3804 Narre Warren East
3804 Narre Warren North
3805 Narre Warren South
3597 Narrung
3638 Nathalia
3409 Natimuk
3465 Natte Yallock
3597 Natya
3384 Navarre
3352 Navigators
3832 Nayook
3496 Neds Corner
3463 Neereman
3831 Neerim
3831 Neerim East
3832 Neerim Junction
3832 Neerim North
3831 Neerim South
3570 Neilborough
3699 Nelse
3292 Nelson
3953 Nerrena
3351 Nerrin Nerrin
3350 Nerrina
3373 Nerring
3418 Netherby
3413 Neuarpurr
3438 New Gisborne
3825 Newborough
3551 Newbridge
3458 Newbury
3219 Newcomb
3268 Newfield
3442 Newham
3925 Newhaven
3350 Newington
3875 Newlands Arm
3364 Newlyn
3364 Newlyn North
3886 Newmerella
3015 Newport
3859 Newry
3462 Newstead
3220 Newtown
3351 Newtown
3418 Nhill
3501 Nichols Point
3882 Nicholson
3042 Niddrie
3042 Niddrie North
3821 Nilma
3821 Nilma North
3533 Ninda
3518 Nine Mile
3351 Nintingbool
3527 Ninyeunook
3268 Nirranda
3268 Nirranda East
3268 Nirranda South
3174 Noble Park
3174 Noble Park North
3833 Noojee
3265 Noorat
3265 Noorat East
3890 Noorinbee
3890 Noorinbee North
3409 Noradjuha
3214 Norlane
3579 Normanville
3682 Norong
3550 North Bendigo
3458 North Blackwood
3215 North Geelong
3051 North Melbourne
9999 North Pole
3187 North Road
3214 North Shore
3678 North Wangaratta
3113 North Warrandyte
3995 North Wonthaggi
3070 Northcote
3070 Northcote South
3072 Northland Centre
3660 Northwood
3377 Norval
3168 Notting Hill
3887 Nowa Nowa
3469 Nowhere Creek
3585 Nowie
3737 Nug Nug
3463 Nuggetty
3435 Nulla Vale
3268 Nullawarre
3268 Nullawarre North
3529 Nullawil
3636 Numurkah
3131 Nunawading
3909 Nungurner
3896 Nunniong
3401 Nurcoung
3401 Nurrabiel
3888 Nurran
3099 Nutfield
3594 Nyah
3595 Nyah West
3533 Nyarrin
3909 Nyerimilang
3987 Nyora
3585 Nyrraby
3046 Oak Park
3063 Oaklands Junction
3166 Oakleigh
3166 Oakleigh East
3167 Oakleigh South
3540 Oakvale
3880 Ocean Grange
3226 Ocean Grove
3809 Officer
3809 Officer South
3701 Old Tallangatta
3788 Olinda
3241 Ombersley
3898 Omeo
3898 Omeo Valley
3249 Ondit
3888 Orbost
3284 Orford
3204 Ormond
3631 Orrvale
3691 Osbornes Flat
3951 Outtrim
3490 Ouyen
3738 Ovens
3678 Oxley
3678 Oxley Flats
3413 Ozenkadnook
3268 Paaratte
3551 Painswick
3810 Pakenham
3810 Pakenham South
3810 Pakenham Upper
3512 Panitya
3265 Panmure
3759 Panton Hill
3477 Paradise
3851 Paradise Beach
3240 Paraparap
3114 Park Orchards
3195 Parkdale
3052 Parkville
3340 Parwan
3315 Paschendale
3044 Pascoe Vale
3044 Pascoe Vale South
3444 Pastoria
3444 Pastoria East
3491 Patchewollock
3564 Patho
3204 Patterson
3197 Patterson Lakes
3318 Patyah
3880 Paynesville
3912 Pearcedale
3851 Pearsondale
3678 Peechelba
3678 Peechelba East
3727 Pelluebla
3235 Pennyroyal
3289 Penshurst
3586 Pental Island
3341 Pentland Hills
3478 Percydale
3413 Peronne
3862 Perry Bridge
3270 Peterborough
3233 Petticoat Creek
3757 Pheasant Creek
3597 Piangil
3572 Piavella
3639 Picola
3639 Picola West
3833 Piedmont
3533 Pier Milan
3407 Pigeon Ponds
3351 Piggoreet
3401 Pimpinio
3573 Pine Grove
3631 Pine Lodge
3709 Pine Mountain
3579 Pine View
3200 Pines Forest
3149 Pinewood
3984 Pioneer Bay
3444 Pipers Creek
3585 Pira
3723 Piries
3249 Pirron Yallock
3351 Pitfield
3360 Pittong
3090 Plenty
3335 Plumpton
3030 Point Cook
3916 Point Leo
3225 Point Lonsdale
3212 Point Wilson
3585 Polisbet
3260 Pomborneit
3249 Pomborneit East
3260 Pomborneit North
3381 Pomonal
3571 Pompapiel
3312 Poolaijelo
3352 Pootilla
3988 Poowong
3988 Poowong East
3988 Poowong North
3461 Porcupine Ridge
3740 Porepunkah
3971 Port Albert
3269 Port Campbell
3284 Port Fairy
3964 Port Franklin
3207 Port Melbourne
3965 Port Welshpool
3223 Portarlington
3305 Portland
3305 Portland North
3305 Portland West
3944 Portsea
3996 Pound Creek
3797 Powelltown
3312 Powers Creek
3517 Powlett Plains
3181 Prahran
3181 Prahran East
3572 Prairie
3666 Pranjip
3685 Prentice North
3072 Preston
3072 Preston Lower
3072 Preston South
3072 Preston West
3054 Princes Hill
3269 Princetown
3662 Puckapunyal
3271 Pura Pura
3289 Purdeet
3278 Purnim
3278 Purnim West
3521 Pyalong
3575 Pyramid Hill
3540 Quambatook
3030 Quandong
3401 Quantong
3550 Quarry Hill
3225 Queenscliff
3984 Queensferry
3373 Raglan
3424 Rainbow
3951 Ranceby
3132 Rangeview
3465 Rathscar
3465 Rathscar West
3023 Ravenhall
3453 Ravenswood
3453 Ravenswood South
3825 Rawson
3880 Raymond Island
3570 Raywood
3496 Red Cliffs
3937 Red Hill
3937 Red Hill South
3371 Red Lion
3350 Redan
3477 Redbank
3523 Redcastle
3444 Redesdale
3658 Reedy Creek
3395 Reedy Dam
3895 Reedy Flat
3579 Reedy Lake
3799 Reefton
3072 Regent West
3095 Research
3073 Reservoir
3858 Reynard
3517 Rheola
3923 Rhyll
3377 Rhymney
3385 Riachella
3480 Rich Avon
3480 Rich Avon East
3480 Rich Avon West
3121 Richmond
3121 Richmond East
3121 Richmond North
3518 Richmond Plains
3121 Richmond South
3431 Riddells Creek
3666 Riggs Creek
3134 Ringwood
3135 Ringwood East
3134 Ringwood North
3818 Ripplebrook
3215 Rippleside
3185 Ripponlea
3401 Riverside
3860 Riverslea
3971 Robertsons Beach
3019 Robinson
3549 Robinvale
3549 Robinvale Irrigation District Section B
3549 Robinvale Irrigation District Section C
3549 Robinvale Irrigation District Section D
3549 Robinvale Irrigation District Section E
3561 Rochester
3442 Rochford
3335 Rockbank
3401 Rocklands
3364 Rocklyn
3377 Rocky Point
3821 Rokeby
3330 Rokewood
3351 Rokewood Junction
3434 Romsey
3084 Rosanna
3678 Rose River
3395 Rosebery
3285 Rosebrook
3939 Rosebud
3939 Rosebud Plaza
3847 Rosedale
3385 Roses Gap
3737 Rosewhite
3564 Roslynmead
3351 Ross Creek
3377 Rossbridge
3477 Rostron
3340 Rowsley
3178 Rowville
3064 Roxburgh Park
3712 Rubicon
3953 Ruby
3666 Ruffy
3691 Running Creek
3558 Runnymede
3388 Rupanyup
3612 Rushworth
3331 Russells Bridge
3685 Rutherglen
3875 Ryans
3992 Ryanston
3941 Rye
3810 Rythdale
3936 Safety Beach
3461 Sailors Falls
3556 Sailors Gully
3461 Sailors Hill
3850 Sale
3852 Sale East Raaf
3517 Salisbury West
3673 Samaria
3925 San Remo
3312 Sandford
3579 Sandhill Lake
3977 Sandhurst
3550 Sandhurst East
3462 Sandon
3171 Sandown Village
3191 Sandringham
3695 Sandy Creek
3959 Sandy Point
3858 Sargood
3875 Sarsfield
3787 Sassafras
3787 Sassafras Gully
3723 Sawmill Settlement
3351 Scarsdale
3179 Scoresby
3352 Scotchmans Lead
3352 Scotsburn
3267 Scotts Creek
3533 Sea Lake
3028 Seabrook
3851 Seacombe
3198 Seaford
3018 Seaholme
3851 Seaspray
3858 Seaton
3821 Seaview
3556 Sebastian
3356 Sebastopol
3011 Seddon
3011 Seddon West
3551 Sedgwick
3159 Selby
3737 Selwyn
3234 Separation Creek
3517 Serpentine
3420 Serviceton
3139 Seville
3139 Seville East
3660 Seymour
3660 Seymour South
3821 Shady Creek
3960 Shallow Inlet
3898 Shannonvale
3377 Shays Flat
3331 She Oaks
3666 Sheans Creek
3392 Sheep Hills
3515 Shelbourne
3329 Shelford
3701 Shelley
3461 Shepherds Flat
3630 Shepparton
3631 Shepparton East
3631 Shepparton North
3630 Shepparton South
3789 Sherbrooke
3916 Shoreham
3444 Sidonia
3795 Silvan
3922 Silverleaves
3266 Simpson
3888 Simpsons Creek
3465 Simson
3233 Skenes Creek
3233 Skenes Creek North
3260 Skibo
3518 Skinners Flat
3361 Skipton
3977 Skye
3477 Slaty Creek
3364 Smeaton
3922 Smiths Beach
3760 Smiths Gully
3364 Smokeytown
3741 Smoko
3351 Smythes Creek
3351 Smythesdale
3971 Snake Island
3351 Snake Valley
3350 Soldiers Hill
3927 Somers
3062 Somerton
3851 Somerton Park
3912 Somerville
3943 Sorrento
3995 South Dudley
3220 South Geelong
3015 South Kingsville
3205 South Melbourne
3752 South Morang
3260 South Purrumbete
3006 South Wharf
3141 South Yarra
3006 Southbank
3283 Southern Cross
3192 Southland Centre
3461 Spargo Creek
3488 Speed
3585 Speewa
3015 Spotswood
3550 Spring Gully
3444 Spring Hill
3352 Springbank
3351 Springdallah
3434 Springfield
3544 Springfield
3682 Springhurst
3364 Springmount
3171 Springvale
3172 Springvale South
3021 St Albans
3219 St Albans Park
3761 St Andrews
3941 St Andrews Beach
3478 St Arnaud
3477 St Arnaud East
3477 St Arnaud North
3995 St Clair
3620 St Germains
3088 St Helena
3285 St Helens
3401 St Helens Plains
3727 St James
3182 St Kilda
3183 St Kilda East
3004 St Kilda Road Central
3004 St Kilda Road Melbourne
3182 St Kilda South
3182 St Kilda West
3223 St Leonards
3971 Staceys Bridge
3351 Staffordshire Reef
3691 Staghorn Flat
3623 Stanhope
3623 Stanhope South
3747 Stanley
3340 Staughton Vale
3379 Stavely
3380 Stawell
3380 Stawell West
3775 Steels Creek
3331 Steiglitz
3725 Stewarton
3893 Stirling
3862 Stockdale
3373 Stockyard Hill
3218 Stonehaven
3373 Stoneleigh
3371 Stony Creek
3957 Stony Creek
3260 Stonyford
3851 Stradbroke
3103 Stradbroke Park
3461 Strangways
3533 Straten
3862 Stratford
3658 Strath Creek
3622 Strathallan
3666 Strathbogie
3550 Strathdale
3312 Strathdownie
3099 Strathewen
3551 Strathfieldsaye
3301 Strathkellar
3364 Strathlea
3641 Strathmerton
3041 Strathmore
3041 Strathmore Heights
3338 Strathtulloh
3351 Streatham
3950 Strzelecki
3477 Stuart Mill
3152 Studfield
3234 Sugarloaf
3658 Sugarloaf Creek
3885 Suggan Buggan
3352 Sulky
3922 Summerlands
3057 Sumner
3429 Sunbury
3658 Sunday Creek
3922 Sunderland Bay
3496 Sunnycliffs
3922 Sunset Strip
3020 Sunshine
3020 Sunshine North
3020 Sunshine West
3922 Surf Beach
3127 Surrey Hills
3127 Surrey Hills North
3125 Surrey Hills South
3477 Sutherland
3331 Sutherlands Creek
3530 Sutton
3448 Sutton Grange
3225 Swan Bay
3585 Swan Hill
3585 Swan Hill West
3225 Swan Island
3249 Swan Marsh
3903 Swan Reach
3673 Swanpool
3477 Swanwater
3480 Swanwater West
3896 Swifts Creek
3037 Sydenham
3575 Sylvaterre
3149 Syndal
3875 Tabberabbera
3607 Tabilk
3289 Tabor
3714 Taggerty
3301 Tahara
3315 Tahara Bridge
3310 Tahara West
3371 Talbot
3691 Talgarno
3701 Tallandoon
3700 Tallangatta
3700 Tallangatta East
3701 Tallangatta South
3701 Tallangatta Valley
3659 Tallarook
3634 Tallygaroopna
3893 Tambo Crossing
3885 Tambo Upper
3890 Tamboon
3858 Tamboritha
3675 Taminick
3669 Tamleugh
3669 Tamleugh North
3260 Tandarook
3571 Tandarra
3691 Tangambalanga
3825 Tanjil
3833 Tanjil Bren
3825 Tanjil South
3764 Tantaraboo
3478 Tanwood
3249 Tanybryn
3447 Taradale
3666 Tarcombe
3451 Tarilta
3551 Tarnagulla
3029 Tarneit
3670 Tarnook
3265 Taroon
3971 Tarra Valley
3414 Tarranyurk
3971 Tarraville
3775 Tarrawarra
3678 Tarrawingee
3315 Tarrayoukyan
3463 Tarrengower
3315 Tarrenlea
3301 Tarrington
3283 Tarrone
3956 Tarwin
3956 Tarwin Lower
3673 Tatong
3616 Tatura
3616 Tatura East
3378 Tatyoon
3697 Tawonga
3698 Tawonga South
3713 Taylor Bay
3037 Taylors Hill
3038 Taylors Lakes
3579 Teal Point
3160 Tecoma
3527 Teddywaddy
3527 Teddywaddy West
3328 Teesdale
3401 Telangatuk East
3730 Telford
3420 Telopea Downs
3106 Templestowe
3107 Templestowe Lower
3489 Tempy
3984 Tenby Point
3572 Tennyson
3264 Terang
3719 Terip Terip
3525 Terrappee
3575 Terrick Terrick
3573 Terrick Terrick East
3260 Tesbury
3821 Tetoora Road
3527 Thalia
3825 Thalloo
3154 The Basin
3268 The Cove
3984 The Gurdies
3851 The Heart
3851 The Honeysuckles
3792 The Patch
3265 The Sisters
3691 Thologolong
3074 Thomastown
3219 Thomson
3825 Thomson
3726 Thoona
3071 Thornbury
3335 Thornhill Park
3712 Thornton
3835 Thorpdale
3824 Thorpdale South
3707 Thowgla Valley
3797 Three Bridges
3960 Tidal River
3885 Timbarra
3268 Timboon
3268 Timboon West
3561 Timmering
3465 Timor
3465 Timor West
3859 Tinamba
3859 Tinamba West
3708 Tintaldra
3542 Tittybong
3549 Tol Tol
3723 Tolmie
3707 Tom Groggin
3621 Tongala
3890 Tonghi Creek
3896 Tongio
3815 Tonimbuk
3409 Tooan
3522 Tooborac
3614 Toolamba
3614 Toolamba West
3777 Toolangi
3337 Toolern Vale
3551 Toolleen
3860 Toolome
3401 Toolondo
3285 Toolong
3825 Toombon
3856 Toongabbie
3962 Toora
3962 Toora North
3980 Tooradin
3142 Toorak
3909 Toorloo Arm
3146 Tooronga
3833 Toorongo
3941 Tootgarook
3228 Torquay
3490 Torrita
3562 Torrumbarry
3821 Torwood
3888 Tostaree
3012 Tottenham
3477 Tottington
3363 Tourello
3596 Towan
3527 Towaninny
3527 Towaninny South
3283 Tower Hill
3707 Towong
3707 Towong Upper
3824 Trafalgar
3824 Trafalgar East
3824 Trafalgar South
3579 Tragowel
3844 Traralgon
3844 Traralgon East
3844 Traralgon South
3032 Travancore
3373 Trawalla
3660 Trawool
3477 Traynors Lagoon
3785 Tremont
3458 Trentham
3458 Trentham East
3583 Tresco
3584 Tresco West
3953 Trida
3029 Truganina
3888 Tubbut
3915 Tuerong
3384 Tulkara
3043 Tullamarine
3728 Tungamah
3546 Turoar
3488 Turriff
3488 Turriff East
3960 Turtons Creek
3490 Tutye
3658 Tyaak
3913 Tyabb
3533 Tyenna
3844 Tyers
3444 Tylden
3444 Tylden South
3813 Tynong
3813 Tynong North
3586 Tyntynder
3586 Tyntynder South
3285 Tyrendarra
3285 Tyrendarra East
3533 Tyrrell
3533 Tyrrell Downs
3370 Ullina
3318 Ullswater
3544 Ultima
3544 Ultima East
3641 Ulupna
3629 Undera
3509 Underbool
3010 University Of Melbourne
3669 Upotipotpon
3156 Upper Ferntree Gully
3691 Upper Gundowring
3673 Upper Lurg
3756 Upper Plenty
3673 Upper Ryans Creek
3664 Upton Hill
3158 Upwey
3860 Valencia Creek
3407 Vasey
3451 Vaughan
3401 Vectis
3922 Ventnor
3956 Venus Bay
3133 Vermont
3133 Vermont South
3814 Vervale
3833 Vesper
3294 Victoria Point
3294 Victoria Valley
3084 Viewbank
3591 Vinifera
3669 Violet Town
3325 Vite Vite
3325 Vite Vite North
3885 W Tree
3637 Waaia
3551 Waanyarra
3269 Waarre
3678 Wabonga
3646 Waggarandall
3687 Wahgunyah
3608 Wahring
3401 Wail
3887 Wairewa
3544 Waitchie
3385 Wal Wal
3678 Waldara
3825 Walhalla
3825 Walhalla East
3956 Walkerville
3956 Walkerville North
3956 Walkerville South
3352 Wallace
3303 Wallacedale
3891 Wallagaraugh
3387 Wallaloo
3387 Wallaloo East
3756 Wallan
3351 Wallinduc
3222 Wallington
3401 Wallup
3463 Walmer
3875 Walpa
3507 Walpeup
3709 Walwa
3612 Wanalta
3216 Wandana Heights
3579 Wandella
3744 Wandiligong
3139 Wandin East
3139 Wandin North
3312 Wando Bridge
3312 Wando Vale
3758 Wandong
3549 Wandown
3678 Wangandary
3891 Wangarabell
3677 Wangaratta
3678 Wangaratta Forward
3678 Wangaratta South
3530 Wangie
3279 Wangoom
3301 Wannon
3152 Wantirna
3152 Wantirna South
3616 Waranga
3612 Waranga Shores
3959 Waratah Bay
3799 Warburton
3465 Wareek
3505 Wargan
3482 Warmur
3243 Warncoort
3530 Warne
3980 Warneet
3286 Warrabkook
3393 Warracknabeal
3820 Warragul
3821 Warragul South
3821 Warragul West
3377 Warrak
3113 Warrandyte
3134 Warrandyte South
3134 Warranwood
3301 Warrayure
3670 Warrenbayne
3352 Warrenheip
3478 Warrenmang
3249 Warrion
3280 Warrnambool
3312 Warrock
3283 Warrong
3401 Wartook
3482 Watchem
3482 Watchem West
3485 Watchupga
3862 Waterford
3658 Waterford Park
3038 Watergardens
3875 Waterholes
3373 Waterloo
3195 Waterways
3087 Watsonia
3087 Watsonia North
3097 Watsons Creek
3995 Wattle Bank
3384 Wattle Creek
3352 Wattle Flat
3096 Wattle Glen
3237 Wattle Hill
3128 Wattle Park
3145 Wattletree Road Po
3352 Waubra
3216 Waurn Ponds
3170 Waverley Gardens
3888 Waygara
3352 Weatherboard
3518 Wedderburn
3518 Wedderburn Junction
3568 Wee Wee Rup
3237 Weeaproinah
3251 Weering
3260 Weerite
3518 Wehla
3338 Weir Views
3551 Wellsford
3462 Welshmans Reef
3966 Welshpool
3549 Wemen
3355 Wendouree
3355 Wendouree Village
3241 Wensleydale
3875 Wentworth
3186 Were Street Po
3352 Werneth
3364 Werona
3030 Werribee
3029 Werribee Plaza
3030 Werribee South
3496 Werrimull
3799 Wesburn
3550 West Bendigo
3992 West Creek
3012 West Footscray
3003 West Melbourne
3690 West Wodonga
3825 Westbury
3579 Westby
3049 Westmeadows
3351 Westmere
3714 Whanregarwen
3564 Wharparilla
3461 Wheatsheaf
3150 Wheelers Hill
3556 Whipstick
3483 Whirily
3550 White Hills
3660 Whiteheads Creek
3950 Whitelaw
3733 Whitfield
3678 Whitlands
3219 Whittington
3757 Whittlesea
3243 Whoorel
3735 Whorouly
3735 Whorouly East
3735 Whorouly South
3612 Whroo
3379 Wickliffe
3728 Wilby
3953 Wild Dog Valley
3429 Wildwood
3393 Wilkur
3485 Willangie
3283 Willatook
3379 Willaura
3379 Willaura North
3393 Willenabrina
3027 Williams Landing
3016 Williamstown
3016 Williamstown North
3825 Willow Grove
3764 Willowmavin
3360 Willowvale
3847 Willung
3847 Willung South
3515 Wilsons Hill
3960 Wilsons Promontory
3922 Wimbledon Heights
3241 Winchelsea
3241 Winchelsea South
3352 Windermere
3181 Windsor
3891 Wingan River
3321 Wingeel
3477 Winjallok
3585 Winlaton
3546 Winnambool
3304 Winnap
3858 Winnindoo
3281 Winslow
3358 Winter Valley
3673 Winton
3673 Winton North
3608 Wirrate
3885 Wiseleigh
3189 Wishart
3690 Wodonga
3691 Wodonga Forward
3690 Wodonga Plaza
3750 Wollert
3888 Wombat Creek
3409 Wombelano
3971 Won Wron
3960 Wonga
3115 Wonga Park
3234 Wongarra
3862 Wongungarra
3737 Wonnangatta
3995 Wonthaggi
3401 Wonwondah
3962 Wonyip
3596 Wood Wood
3442 Woodend
3442 Woodend North
3715 Woodfield
3281 Woodford
3875 Woodglen
3294 Woodhouse
3945 Woodleigh
3723 Woods Point
3874 Woodside
3874 Woodside Beach
3874 Woodside North
3751 Woodstock
3551 Woodstock On Loddon
3463 Woodstock West
3556 Woodvale
3249 Wool Wool
3995 Woolamai
3860 Woolenook
3518 Woolshed Flat
3276 Woolsthorpe
3485 Woomelang
3747 Wooragee
3962 Woorarra East
3960 Woorarra West
3953 Wooreen
3139 Woori Yallock
3589 Woorinen
3589 Woorinen North
3588 Woorinen South
3272 Woorndoo
3525 Wooroonook
3518 Woosang
3315 Wootong Vale
3858 Worrowing
3860 Wrathung
3860 Wrixon
3891 Wroxham
3875 Wuk Wuk
3885 Wulgulmerang
3885 Wulgulmerang East
3885 Wulgulmerang West
3635 Wunghnu
3241 Wurdiboluc
3850 Wurruk
3875 Wy Yung
3527 Wycheproof
3527 Wycheproof South
3525 Wychitella
3525 Wychitella North
3234 Wye River
3237 Wyelangta
3024 Wyndham Vale
3620 Wyuna
3620 Wyuna East
3424 Yaapeet
3646 Yabba North
3646 Yabba South
3749 Yackandandah
3637 Yalca
3378 Yalla-Y-Poora
3085 Yallambie
3825 Yallourn
3825 Yallourn North
3885 Yalmy
3285 Yambuk
3621 Yambuna
3755 Yan Yean
3418 Yanac
3960 Yanakie
3537 Yando
3461 Yandoit
3461 Yandoit Hills
3283 Yangery
3858 Yangoura
3981 Yannathan
3451 Yapeen
3719 Yarck
3283 Yarpturk
3775 Yarra Glen
3797 Yarra Junction
3516 Yarraberb
3823 Yarragon
3823 Yarragon South
3971 Yarram
3091 Yarrambat
3013 Yarraville
3013 Yarraville West
3575 Yarrawalla
3730 Yarrawonga
3730 Yarrawonga South
3644 Yarroweyah
3677 Yarrunga
3301 Yatchaw
3478 Yawong Hills
3717 Yea
3139 Yellingbo
3505 Yelta
3352 Yendon
3249 Yeo
3249 Yeodene
3770 Yering
3525 Yeungroon
3525 Yeungroon East
3638 Yielima
3869 Yinnar
3869 Yinnar South
3477 York Plains
3646 Youanmite
3728 Youarang
3301 Yulecart
3727 Yundool
3063 Yuroke
3237 Yuulong
3634 Zeerust
3401 Zumsteins`;

const WA = `6280 Abba River
6280 Abbey
6280 Acton Park
6375 Adamsvale
6532 Ajana
6330 Albany
6306 Aldersyde
6064 Alexander Heights
6288 Alexandra Bridge
6154 Alfred Cove
6038 Alkimos
6525 Allanooka
6225 Allanson
6535 Alma
6632 Ambania
6280 Ambergate
6338 Amelup
6642 Angelo River
6167 Anketell
6280 Anniebrook
6714 Antonymyre
6153 Applecross
6153 Applecross North
6419 Ardath
6153 Ardross
6239 Argyle
6112 Armadale
6519 Arrino
6525 Arrowsmith
6519 Arrowsmith East
6315 Arthur River
6104 Ascot
6065 Ashby
6111 Ashendon
6054 Ashfield
6156 Attadale
6164 Atwell
6164 Aubin Grove
6290 Augusta
6233 Australind
6069 Aveley
6084 Avon Valley National Park
6412 Baandee
6428 Babakin
6701 Babbage Island
6317 Badgebup
6475 Badgerin Rock
6302 Badgin
6521 Badgingarra
6383 Badjaling
6082 Bailup
6562 Bakers Hill
6258 Balbarrup
6021 Balcatta
6171 Baldivis
6061 Balga
6253 Balingup
6383 Balkuling
6714 Balla Balla
6302 Balladong
6443 Balladonia
6066 Ballajura
6315 Ballaying
6606 Ballidu
6304 Bally Bally
6503 Bambun
6450 Bandy Creek
6440 Bandya
6164 Banjup
6031 Banksia Grove
6213 Banksiadale
6390 Bannister
6479 Barbalin
6510 Barberton
6275 Barrabup
6209 Barragup
6712 Barrow Island
6056 Baskerville
6054 Bassendean
6150 Bateman
6284 Baudin
6714 Baynton
6330 Bayonet Head
6053 Bayswater
6530 Beachlands
6472 Beacon
6162 Beaconsfield
6440 Beadell
6394 Beaufort River
6450 Beaumont
6107 Beckenham
6052 Bedford
6112 Bedfordale
6063 Beechboro
6556 Beechina
6260 Beedelup
6224 Beela
6239 Beelerup
6164 Beeliar
6353 Beenong
6503 Beermullah
6566 Bejoording
6027 Beldon
6069 Belhus
6056 Bellevue
6104 Belmont
6477 Bencubbin
6223 Benger
6463 Benjaberring
6255 Benjinup
6063 Bennett Springs
6102 Bentley
6102 Bentley Dc
6102 Bentley South
6530 Beresford
6510 Berkshire Valley
6701 Bernier Island
6167 Bertram
6304 Beverley
6163 Bibra Lake
6076 Bickley
6157 Bicton
6260 Biddelia
6330 Big Grove
6375 Bilbarin
6725 Bilingurr
6472 Bimbijy
6574 Bindi Bindi
6502 Bindoon
6502 Bindoon Training Area
6430 Binduli
6233 Binningup
6532 Binnu
6214 Birchmont
6530 Bluff Point
6208 Blythewood
6280 Boallia
6320 Bobalong
6424 Bodallin
6390 Boddington
6394 Boilup
6392 Bokal
6568 Bolgart
6479 Bonnie Rock
6525 Bonniefield
6722 Boodarie
6423 Boodarockin
6525 Bookara
6503 Boonanarring
6429 Boorabbin
6154 Booragoon
6475 Booralaming
6431 Boorara
6262 Boorara Brook
6532 Bootenal
6521 Boothendarra
6286 Boranup
6338 Borden
6320 Borderdale
6330 Bornholm
6394 Boscabel
6432 Boulder
6312 Boundain
6211 Bouvard
6280 Bovell
6333 Bow Bridge
6225 Bowelling
6535 Bowes
6623 Bowgada
6338 Boxwood Hill
6056 Boya
6237 Boyanup
6450 Boyatup
6316 Boyerine
6244 Boyup Brook
6055 Brabham
6285 Bramley
6251 Brazier
6503 Breera
6338 Bremer Bay
6153 Brentwood
6043 Breton Bay
6255 Bridgetown
6069 Brigadoon
6532 Bringo
6280 Broadwater
6009 Broadway Nedlands
6430 Broadwood
6701 Brockman
6398 Broke
6112 Brookdale
6239 Brookhampton
6306 Brookton
6725 Broome
6318 Broomehill
6318 Broomehill East
6318 Broomehill Village
6318 Broomehill West
6431 Brown Hill
6701 Brown Range
6418 Bruce Rock
6224 Brunswick
6225 Buckingham
6401 Buckland
6714 Bulgarra
6149 Bull Creek
6429 Bullabulling
6373 Bullaring
6532 Buller
6484 Bullfinch
6350 Bullock Hills
6084 Bullsbrook
6431 Bulong
6306 Bulyee
6230 Bunbury
6522 Bundanoon
6353 Buniche
6620 Bunjil
6613 Buntine
6467 Burakin
6452 Buraminya
6227 Burekup
6302 Burges
6401 Burlong
6532 Burma Road
6028 Burns Beach
6285 Burnside
6421 Burracoppin
6490 Burran Rock
6714 Burrup
6100 Burswood
6055 Bushmead
6280 Busselton
6036 Butler
6122 Byford
6726 Cable Beach
6466 Cadoux
6443 Caiguna
6569 Calingiri
6167 Calista
6302 Caljie
6260 Callcup
6728 Camballin
6743 Cambridge Gulf
6111 Camillo
6315 Cancanning
6710 Cane
6627 Canna
6153 Canning Bridge Applecross
6111 Canning Mills
6155 Canning Vale
6155 Canning Vale Dc
6155 Canning Vale South
6107 Cannington
6452 Cape Arid
6532 Cape Burney
6450 Cape Le Grand
6707 Cape Range National Park
6271 Capel
6271 Capel River
6642 Capricorn
6041 Caraban
6033 Carabooda
6569 Carani
6701 Carbla
6280 Carbunup River
6225 Cardiff
6122 Cardup
6230 Carey Park
6020 Carine
6101 Carlisle
6101 Carlisle North
6275 Carlotta
6076 Carmel
6517 Carnamah
6701 Carnarvon
6423 Carrabin
6031 Carramar
6532 Carrarang
6317 Carrolup
6316 Cartmeticup
6450 Cascade
6450 Castletown
6167 Casuarina
6507 Cataby
6255 Catterick
6055 Caversham
6330 Centennial Park
6511 Cervantes
6450 Chadwick
6111 Champion Lakes
6490 Chandler
6394 Changerup
6260 Channybearup
6280 Chapman Hill
6239 Charley Creek
6395 Cherry Tree Pool
6328 Cheynes
6751 Chichester
6556 Chidlow
6084 Chittering
6244 Chowerup
6798 Christmas Island
6018 Churchlands
6015 City Beach
6000 City Delivery Centre
6564 Clackline
6010 Claremont
6010 Claremont North
6030 Clarkson
6472 Cleary
6714 Cleaverville
6211 Clifton
6105 Cloverdale
6317 Coblinine
6532 Coburn
6164 Cockburn Central
6443 Cocklebiddy
6308 Codjatotine
6302 Cold Harbour
6315 Collanilling
6230 College Grove
6225 Collie
6225 Collie Burn
6330 Collingwood Heights
6330 Collingwood Park
6260 Collins
6311 Commodine
6152 Como
6450 Condingup
6027 Connolly
6311 Contine
6210 Coodanup
6166 Coogee
6219 Cookernup
6638 Cooladar Hill
6163 Coolbellup
6050 Coolbinia
6532 Coolcalalaya
6429 Coolgardie
6507 Cooljarloo
6168 Cooloongup
6214 Coolup
6450 Coomalbidgup
6512 Coomberdale
6503 Coonabidgee
6566 Coondle
6515 Coorow
6714 Cooya Pooya
6562 Copley
6701 Coral Bay
6426 Corinthia
6375 Corrigin
6440 Cosmo Newbery
6720 Cossack
6011 Cottesloe
6288 Courtenay
6336 Cowalellup
6503 Cowalla
6284 Cowaramup
6485 Cowcowing
6317 Coyrecup
6025 Craigie
6420 Cramphorne
6321 Cranbrook
6009 Crawley
6236 Crooked Brook
6390 Crossman
6262 Crowea
6311 Cuballing
6383 Cubbine
6640 Cue
6566 Culham
6067 Cullacabardee
6503 Cullalla
6434 Cundeelee
6407 Cunderdin
6275 Cundinup
6401 Cunjardine
6028 Currambine
6330 Cuthbert
6410 Daadenning Creek
6638 Daggar Hills
6008 Daglish
6304 Dale
6302 Daliak
6009 Dalkeith
6609 Dalwallinu
6230 Dalyellup
6450 Dalyup
6713 Dampier
6713 Dampier Archipelago
6725 Dampier Peninsula
6479 Dandanning
6507 Dandaragan
6383 Dangin
6065 Darch
6392 Dardadine
6236 Dardanup
6236 Dardanup West
6392 Darkan
6122 Darling Downs
6070 Darlington
6275 Darradup
6532 Dartmoor
6320 Dartnall
6317 Datatine
6230 Davenport
6211 Dawesville
6055 Dayton
6722 De Grey
6258 Deanmill
6532 Deepdale
6290 Deepdene
6324 Denbarker
6537 Denham
6333 Denmark
6728 Derby
6630 Devils Creek
6567 Dewars Pool
6258 Diamond Tree
6059 Dianella
6532 Dindiloa
6258 Dingup
6244 Dinninup
6537 Dirk Hartog Island
6258 Dixvale
6725 Djugun
6525 Dongara
6315 Dongolocking
6258 Donnelly River
6239 Donnybrook
6112 Doobarda
6383 Doodenanning
6411 Doodlakine
6701 Dorre Island
6018 Doubleview
6461 Dowerin
6330 Drome
6532 Drummond Cove
6311 Dryandra
6740 Drysdale River
6519 Dudawa
6363 Dudinin
6210 Dudley Park
6475 Dukin
6383 Dulbelling
6425 Dulyalbin
6566 Dumbarton
6312 Dumberning
6350 Dumbleyung
6023 Duncraig
6443 Dundas
6355 Dunn Rock
6281 Dunsborough
6743 Durack
6393 Duranillin
6532 Durawah
6308 Dwarda
6213 Dwellingup
6281 Eagle Bay
6290 East Augusta
6606 East Ballidu
6304 East Beverley
6535 East Bowes
6230 East Bunbury
6107 East Cannington
6701 East Carnarvon
6532 East Chapman
6606 East Damboring
6158 East Fremantle
6705 East Lyons River
6450 East Munglinup
6640 East Murchison
6532 East Nabawa
6275 East Nannup
6355 East Newdegate
6004 East Perth
6308 East Pingelly
6309 East Popanyinning
6168 East Rockingham
6101 East Victoria Park
6370 East Wickepin
6532 East Yuna
6260 Eastbrook
6232 Eaton
6054 Eden Hill
6027 Edgewater
6515 Eganu
6034 Eglinton
6725 Eighty Mile Beach
6490 Elabbin
6479 Elachbutting
6237 Elgin
6330 Elleker
6069 Ellenbrook
6532 Ellendale
6062 Embleton
6431 Emu Flat
6330 Emu Point
6518 Eneabba
6484 Ennuin
6532 Eradu
6532 Eradu South
6210 Erskine
6450 Esperance
6213 Etmilyn
6443 Eucla
6532 Eurardy
6317 Ewlyamartup
6707 Exmouth
6707 Exmouth Gulf
6208 Fairbridge
6210 Falcon
6236 Ferguson
6148 Ferndale
6431 Feysville
6432 Fimiston
6722 Finucane
6337 Fitzgerald
6346 Fitzgerald River National Park
6765 Fitzroy Crossing
6302 Flint
6014 Floreat
6302 Flynn
6286 Forest Grove
6324 Forest Hill
6434 Forrest
6271 Forrest Beach
6359 Forrestania
6112 Forrestdale
6058 Forrestfield
6716 Fortescue
6537 Francois Peron National Park
6396 Frankland River
6443 Fraser Range
6160 Fremantle
6330 Frenchman Bay
6209 Furnissdale
6574 Gabalong
6041 Gabbadah
6476 Gabbin
6337 Gairdner
6714 Gap Ridge
6168 Garden Island
6705 Gascoyne Junction
6705 Gascoyne River
6728 Geegully Creek
6230 Gelorup
6280 Geographe
6532 Georgina
6530 Geraldton
6426 Ghooli
6743 Gibb
6448 Gibson
0872 Gibson Desert North
0872 Gibson Desert South
6083 Gidgegannup
6302 Gilgering
6370 Gillimanning
6510 Gillingarra
6701 Gilroyd
6725 Gingerah
6503 Gingin
6503 Ginginup
6064 Girrawheen
6330 Gledhow
6071 Glen Forrest
6230 Glen Iris
6239 Glen Mervyn
6316 Glencoe
6016 Glendalough
6532 Glenfield
6256 Glenlynn
6258 Glenoran
6509 Glentromie
6077 Gnangara
6285 Gnarabup
6714 Gnoorea
6335 Gnowangerup
6328 Gnowellen
6174 Golden Bay
6330 Goode Beach
6468 Goodlands
6460 Goomalling
6415 Goomarin
6076 Gooseberry Hill
6375 Gorge Rock
6556 Gorrie
6110 Gosnells
6284 Gracetown
6503 Granville
6446 Grass Patch
6403 Grass Valley
6514 Green Head
6328 Green Range
6330 Green Valley
6254 Greenbushes
6210 Greenfields
6302 Greenhills
6056 Greenmount
6532 Greenough
6024 Greenwood
6405 Greenwoods Valley
6535 Gregory
6521 Grey
6701 Greys Plain
6253 Grimwade
6041 Guilderton
6055 Guildford
6315 Gundaring
6513 Gunyidi
6623 Gutha
6302 Gwambygine
6018 Gwelup
6018 Gwelup Dc
6237 Gwindinup
6076 Hacketts Gully
6770 Halls Creek
6210 Halls Head
6215 Hamel
6288 Hamelin Bay
6532 Hamelin Pool
6022 Hamersley
6716 Hamersley Range
6163 Hamilton Hill
6164 Hammond Park
6430 Hannans
6225 Harris River
6112 Harrisdale
6361 Harrismith
6220 Harvey
6308 Hastings
6356 Hatter Hill
6333 Hay
6112 Haynes
6055 Hazelmere
6333 Hazelvale
6027 Heathridge
6056 Helena Valley
6166 Henderson
6055 Henley Brook
6236 Henty
6017 Herdsman
6056 Herne Hill
6211 Herron
6255 Hester
6255 Hester Brook
6532 Hickety
6443 Higginsville
6057 High Wycombe
6313 Highbury
6003 Highgate
6112 Hilbert
6521 Hill River
6025 Hillarys
6168 Hillman
6312 Hillside
6163 Hilton
6462 Hindmarsh
6413 Hines Hill
6280 Hithergreen
6065 Hocking
6566 Hoddys Well
6220 Hoffman
6426 Holleton
6522 Holmwood
6355 Holt Rock
6213 Holyoake
6165 Hope Valley
6125 Hopeland
6348 Hopetoun
6535 Horrocks
6530 Houtman Abrolhos
6071 Hovea
6532 Howatharra
6450 Howick
6460 Hulongine
6110 Huntingdale
6359 Hyden
6522 Ikewa
6028 Iluka
6721 Indee
6701 Inggarda
6213 Inglehope
6052 Inglewood
6302 Inkpen
6018 Innaloo
6751 Innawanga
6401 Irishtown
0872 Irrunytju
6525 Irwin
6452 Israelite Bay
6535 Isseka
6335 Jackitup
6337 Jacup
6275 Jalbarragup
6315 Jaloran
6077 Jandabup
6164 Jandakot
6056 Jane Brook
6258 Jardee
6728 Jarlmadangah Burru
6124 Jarrahdale
6275 Jarrahwood
6306 Jelcobine
6401 Jennacubbine
6401 Jennapullin
6346 Jerdacuttup
6337 Jerramungup
6612 Jibberding
6753 Jigalong
6365 Jilakin
6036 Jindalee
6280 Jindong
6395 Jingalup
6365 Jitarning
6014 Jolimont
6027 Joondalup
6027 Joondalup Dc
6060 Joondanna
6567 Julimar
6751 Juna Downs
6516 Jurien Bay
6519 Kadathinni
6076 Kalamunda
6468 Kalannie
6536 Kalbarri
6536 Kalbarri National Park
6330 Kalgan
6430 Kalgoorlie
6280 Kalgup
6025 Kallaroo
6280 Kaloorup
6740 Kalumburu
6442 Kambalda East
6442 Kambalda West
6255 Kangaroo Gully
6431 Kanowna
0872 Kanpa
6044 Karakin
6642 Karalundi
6152 Karawara
6163 Kardinya
6751 Karijini
6358 Karlgarin
6430 Karlkurla
6479 Karloning
6530 Karloo
6176 Karnup
6111 Karragullen
6010 Karrakatta
6122 Karrakup
6429 Karramindie
6460 Karranadgin
6714 Karratha
6714 Karratha Industrial Estate
6288 Karridale
6018 Karrinyup
6472 Karroun Hill
6317 Katanning
6401 Katrine
6302 Kauring
6280 Kealy
6335 Kebaringup
6410 Kellerberrin
6111 Kelmscott
6111 Kelmscott Dc
6323 Kendenup
6316 Kenmare
6701 Kennedy Range
6151 Kensington
6333 Kentdale
6107 Kenwick
6182 Keralup
6105 Kewdale
6126 Keysbrook
6054 Kiara
6728 Kimbolton
6330 King River
6005 Kings Park
6701 Kingsford
6026 Kingsley
6256 Kingston
6065 Kingsway
6028 Kinross
6372 Kirk Rock
6251 Kirup
0872 Kiwirrkurra
6328 Kojaneerup South
6532 Kojarena
6395 Kojonup
6304 Kokeby
6367 Kondinin
6605 Kondut
6603 Konnongorring
6510 Koojan
6431 Kookynie
6733 Koolan Island
6623 Koolanooka
6427 Koolyanobbing
6461 Koomberkine
6064 Koondoola
6056 Koongamia
6475 Koorda
6415 Korbel
6333 Kordabup
6485 Korrelocking
6330 Kronkup
6290 Kudardup
6353 Kuender
6352 Kukerin
6244 Kulikup
6365 Kulin
6365 Kulin West
6470 Kulja
6642 Kumarina
6770 Kundat Djaru
6375 Kunjin
6489 Kununoppin
6743 Kununurra
6770 Kupartiya
6431 Kurnalpi
6375 Kurrenkutten
6306 Kweda
6490 Kwelkan
6167 Kwinana Beach
6167 Kwinana Town Centre
6385 Kwolyin
6725 Lagrange
6743 Lake Argyle
6640 Lake Austin
6355 Lake Biddy
6479 Lake Brown
6355 Lake Camm
6646 Lake Carnegie
6215 Lake Clifton
6166 Lake Coogee
6438 Lake Darlot
6484 Lake Deborah
6353 Lake Grace
6603 Lake Hinds
6260 Lake Jasper
6356 Lake King
6475 Lake Margarette
6258 Lake Muir
6603 Lake Ninan
6320 Lake Toolbrunup
6440 Lake Wells
6180 Lakelands
6431 Lakewood
6430 Lamington
6044 Lancelin
6065 Landsdale
6330 Lange
6147 Langford
6616 Latham
6100 Lathlain
6440 Laverton
6707 Learmonth
6170 Leda
6043 Ledge Point
6007 Leederville
6514 Leeman
6149 Leeming
6290 Leeuwin
6437 Leinster
6503 Lennard Brook
6438 Leonora
6233 Leschenault
6111 Lesley
6076 Lesmurdie
6079 Lexia
6315 Lime Lake
6258 Linfarne
6330 Little Grove
6359 Little Italy
6646 Little Sandy Desert
6522 Lockier
6054 Lockridge
6330 Lockyer
6311 Lol Gray
6429 Londonderry
6447 Lort River
6240 Lowden
6084 Lower Chittering
6390 Lower Hotham
6330 Lower King
6330 Lowlands
6280 Ludlow
6395 Lumeah
6225 Lyalls Mill
6701 Lyndon
6147 Lynwood
6701 Macleod
6109 Maddington
6065 Madeley
6210 Madora Bay
6443 Madura
6355 Magenta
6338 Magitup
6072 Mahogany Creek
6530 Mahomets Flats
6057 Maida Vale
6714 Maitland
6401 Malabaine
6090 Malaga
6302 Malebelling
6353 Mallee Hill
6556 Malmalling
6370 Malyalling
6167 Mandogalup
6210 Mandurah
6210 Mandurah Dc
6210 Mandurah East
6210 Mandurah North
6258 Manjimup
6465 Manmanning
6152 Manning
0872 Mantamaru
6328 Manypeaks
6064 Marangaroo
6256 Maranup
6330 Marbelup
6760 Marble Bar
6515 Marchagee
6125 Mardella
6714 Mardie
6285 Margaret River
6078 Mariginiup
6020 Marmion
6608 Marne
6317 Marracoonda
6390 Marradong
6532 Marrah
6213 Marrinup
6110 Martin
6426 Marvel Loch
6280 Marybrook
6701 Massey Bay
6614 Maya
6244 Mayanup
6051 Maylands
6225 McAlinden
6770 McBeath
6330 McKail
6532 Meadow
6210 Meadow Springs
6405 Meckering
6728 Meda
6167 Medina
6642 Meekatharra
6392 Meeking
6208 Meelon
6401 Meenaar
6262 Meerup
6079 Melaleuca
6156 Melville
6050 Menora
6436 Menzies
6352 Merilup
6450 Merivale
6625 Merkanooka
6415 Merredin
6030 Merriwa
6530 Meru
6280 Metricup
6328 Mettler
6612 Miamoon
6056 Middle Swan
6258 Middlesex
6330 Middleton Beach
6056 Midland
6056 Midvale
6575 Miling
6714 Millars Well
6232 Millbridge
6330 Millbrook
6056 Millendon
6336 Mills Lake
6716 Millstream
6525 Milo
6330 Milpara
6507 Mimegarra
6336 Mindarabin
6030 Mindarie
6503 Mindarra
6315 Minding
6522 Mingenew
6312 Minigin
6701 Minilya
6532 Minnenooka
6462 Minnivale
6725 Minyirr
6330 Mira Mar
6061 Mirrabooka
6740 Mitchell Plateau
6395 Mobrup
6603 Mocardy
6506 Mogumber
6401 Mokine
6394 Mokup
6475 Mollerin
6290 Molloy Island
6338 Monjebup
6450 Monjingup
6537 Monkey Mia
6393 Moodiarrup
6317 Moojebing
6504 Mooliabeenee
6503 Moondah
6567 Moondyne
6320 Moonies Hill
6532 Moonyoonooka
6510 Moora
6503 Moore River National Park
6522 Mooriary
6425 Moorine Rock
6083 Morangup
6623 Morawa
6304 Morbinning
6258 Mordalup
6530 Moresby
6701 Morgantown
6062 Morley
6221 Mornington
6012 Mosman Park
6351 Moulyinning
6525 Mount Adams
6714 Mount Anketell
6324 Mount Barker
6522 Mount Budd
6429 Mount Burges
6410 Mount Caroline
6010 Mount Claremont
6330 Mount Clarence
6390 Mount Cooke
6330 Mount Elphinstone
6532 Mount Erin
6426 Mount Hampton
6302 Mount Hardey
6765 Mount Hardman
6016 Mount Hawthorn
6082 Mount Helena
6528 Mount Hill
6426 Mount Holland
6525 Mount Horner
6426 Mount Jackson
6050 Mount Lawley
6333 Mount Lindesay
6356 Mount Madden
6638 Mount Magnet
6330 Mount Melville
6112 Mount Nasura
6447 Mount Ney
6302 Mount Observation
6426 Mount Palmer
6153 Mount Pleasant
6112 Mount Richon
6333 Mount Romance
6751 Mount Sheila
6355 Mount Sheridan
6383 Mount Stirling
6530 Mount Tarcoola
6369 Mount Walker
6390 Mount Wells
6472 Mouroubra
6501 Muchea
6503 Muckenburra
6770 Mueller Ranges
6225 Muja
6479 Mukinbudin
6714 Mulataga
6751 Mulga Downs
6027 Mullaloo
6252 Mullalyup
6630 Mullewa
6430 Mullingar
6401 Muluckine
6225 Mumballup
6401 Mumberkine
6721 Mundabullangana
6073 Mundaring
6123 Mundijong
6443 Mundrabilla
6225 Mungalup
6450 Munglinup
6166 Munster
6420 Muntadgin
6394 Muradup
6630 Murchison
6150 Murdoch
6317 Murdong
6401 Muresk
6220 Myalup
6207 Myara
6154 Myaree
6450 Myrup
6532 Nabawa
6350 Nairibin
6485 Nalkain
6338 Nalyerlup
6512 Namban
6207 Nambeelup
6521 Nambung
6330 Nanarup
6537 Nanga
6215 Nanga Brook
6414 Nangeenan
6522 Nangetty
6275 Nannup
6532 Nanson
6751 Nanutarra
6330 Napier
6532 Naraling
6369 Narembeen
6532 Narngulu
6532 Narra Tarra
6302 Narraloggan
6326 Narrikup
6312 Narrogin
6312 Narrogin Valley
6281 Naturaliste
6165 Naval Base
6440 Neale
6009 Nedlands
6009 Nedlands Dc
6336 Needilup
6353 Neendaling
6031 Neerabup
6503 Neergabby
6485 Nembudding
6450 Neridup
6630 Nerramyne
6532 Nerren Nerren
6509 New Norcia
6475 Newcarlbeon
6355 Newdegate
6251 Newlands
6753 Newman
0872 Ngaanyatjarra-Giles
6714 Nickol
6044 Nilgen
6288 Nillup
6701 Ningaloo
6350 Nippering
6208 Nirimba
6225 Noggerup
6415 Nokaning
6532 Nolba
6061 Nollamara
6312 Nomans Lake
6062 Noranda
6333 Nornalup
6415 Norpa
6443 Norseman
6412 North Baandee
6390 North Bannister
6020 North Beach
6424 North Bodallin
6237 North Boyanup
6353 North Burngup
6445 North Cascade
6163 North Coogee
6207 North Dandalup
6532 North Eradu
6159 North Fremantle
6254 North Greenbushes
6280 North Jindong
6410 North Kellerberrin
6352 North Kukerin
6489 North Kununoppin
6163 North Lake
6353 North Lake Grace
6351 North Moulyinning
6006 North Perth
6701 North Plantations
6338 North Stirlings
6409 North Tammin
6488 North Trayning
6398 North Walpole
6707 North West Cape
6473 North Wialki
6487 North Yelbeni
6208 North Yunderup
6401 Northam
6535 Northampton
6003 Northbridge
6262 Northcliffe
6532 Northern Gully
6032 Nowergup
6609 Nugadong
6480 Nukarni
6758 Nullagine
6330 Nullaki
6450 Nulsen
6490 Nungarin
6630 Nunierra
6566 Nunile
6341 Nyabing
6163 O'Connor
6532 Oakajee
6121 Oakford
6208 Oakley
6333 Ocean Beach
6027 Ocean Reef
6535 Ogilvie
6569 Old Plains
6121 Oldbury
6336 Ongerup
6710 Onslow
6740 Oombulgurri
6431 Ora Banda
6330 Orana
6109 Orange Grove
6503 Orange Springs
6394 Orchid Valley
6770 Ord River
6167 Orelia
6017 Osborne Park
6017 Osborne Park Dc
6285 Osmington
6025 Padbury
6258 Palgarup
6335 Pallinup
6328 Palmdale
6225 Palmer
6157 Palmyra
6157 Palmyra Dc
6716 Pannawonica
6384 Pantapin
0872 Papulankutja
6754 Paraburdoo
6236 Paradise
6721 Pardoo
6426 Parker Range
6081 Parkerville
6434 Parkeston
6233 Parkfield
6180 Parklands
6147 Parkwood
6167 Parmelia
6333 Parryville
0872 Patjarr
6076 Paulls Valley
6239 Paynedale
6612 Paynes Find
6638 Paynesville
6333 Peaceful Bay
6642 Peak Hill
6065 Pearsall
6710 Peedamulla
6260 Peerabeelup
6714 Pegs Creek
6230 Pelican Point
6260 Pemberton
6011 Peppermint Grove
6271 Peppermint Grove Beach
6620 Perenjori
6324 Perillup
6168 Peron
6000 Perth
6105 Perth Airport
6000 Perth Gpo
6258 Perup
6468 Petrudor
6112 Piara Waters
6572 Piawaning
6430 Piccadilly
6076 Pickering Brook
6229 Picton
6229 Picton East
6076 Piesse Brook
6315 Piesseville
6631 Pindar
6357 Pingaring
6308 Pingelly
6343 Pingrup
6078 Pinjar
6208 Pinjarra
6450 Pink Lake
6623 Pintharuka
6317 Pinwernying
6722 Pippingarra
6608 Pithara
6431 Plumridge Lakes
6208 Point Grey
6720 Point Samson
6309 Popanyinning
6324 Porongurup
6330 Port Albany
6525 Port Denison
6721 Port Hedland
6172 Port Kennedy
6167 Postans
6215 Preston Beach
6225 Preston Settlement
6285 Prevelly
6740 Prince Regent River
6308 Pumphreys Bridge
6770 Purnululu
6383 Quairading
6394 Qualeup
6281 Quedjinup
6107 Queens Park
6239 Queenwood
6405 Quelagetting
6302 Quellington
6281 Quindalup
6391 Quindanning
6258 Quinninup
6030 Quinns Rocks
6390 Ranford
6530 Rangeway
6346 Ravensthorpe
6208 Ravenswood
6434 Rawlinna
6503 Red Gully
6056 Red Hill
6721 Redbank
6104 Redcliffe
6286 Redgate
6327 Redmond
6327 Redmond West
6640 Reedy
6507 Regans Ford
6280 Reinscourt
6472 Remlap
6076 Reservoir
6030 Ridgewood
6258 Ringbark
6148 Riverton
6103 Rivervale
6330 Robinson
6168 Rockingham
6168 Rockingham Beach
6168 Rockingham Dc
6751 Rocklea
6532 Rockwell
6397 Rocky Gully
6718 Roebourne
6725 Roebuck
6226 Roelands
6111 Roleystone
6285 Rosa Brook
6285 Rosa Glen
6401 Rossmore
6148 Rossmoyne
6620 Rothsay
6161 Rottnest Island
6280 Ruabon
6532 Rudds Gully
6395 Ryansbrook
6280 Sabina River
6169 Safety Bay
6445 Salmon Gums
6152 Salter Point
6163 Samson
6210 San Remo
6330 Sandpatch
6532 Sandsprings
6639 Sandstone
6535 Sandy Gully
6074 Sawyers Valley
6447 Scaddan
6019 Scarborough
6285 Schroeder
6333 Scotsdale
6288 Scott River
6275 Scott River East
6244 Scotts Brook
6042 Seabird
6173 Secret Harbour
6330 Seppings
6125 Serpentine
6112 Seville Grove
6386 Shackleton
6333 Shadforth
6262 Shannon
6537 Shark Bay
6148 Shelley
6008 Shenton Park
6714 Sherlock
6169 Shoalwater
6225 Shotts
6280 Siesta Park
6210 Silver Sands
6065 Sinagra
6450 Sinclair
6175 Singleton
6437 Sir Samuel
6426 Skeleton Rock
6258 Smith Brook
6207 Solus
6430 Somerville
6020 Sorrento
6424 South Bodallin
6432 South Boulder
6230 South Bunbury
6421 South Burracoppin
6701 South Carnarvon
6317 South Datatine
6411 South Doodlakine
6162 South Fremantle
6317 South Glencoe
6528 South Greenough
6055 South Guildford
6722 South Hedland
6430 South Kalgoorlie
6352 South Kukerin
6368 South Kumminin
6489 South Kununoppin
6164 South Lake
6353 South Lake Grace
6635 South Murchison
6355 South Newdegate
6151 South Perth
6151 South Perth Angelo St
6701 South Plantations
6383 South Quairading
6324 South Stirling
6409 South Tammin
6488 South Trayning
6487 South Yelbeni
6426 South Yilgarn
6532 South Yuna
6208 South Yunderup
6253 Southampton
6401 Southern Brook
6426 Southern Cross
6110 Southern River
6530 Spalding
6163 Spearwood
6330 Spencer Park
6401 Spencers Brook
6525 Springfield
6308 Springs
6728 St George Ranges
6102 St James
6302 St Ronans
6181 Stake Hill
6021 Stirling
6271 Stirling Estate
6338 Stirling Range National Park
6081 Stoneville
6714 Stove Hill
6530 Strathalbyn
6237 Stratham
6309 Stratherne
6056 Stratton
6721 Strelley
6770 Sturt Creek
6008 Subiaco
6008 Subiaco East
6164 Success
6256 Sunnyside
6530 Sunset Beach
6056 Swan View
6010 Swanbourne
6324 Takalarup
6710 Talandji
6302 Talbot
6302 Talbot West
6490 Talgomine
6701 Talisker
6532 Tamala
6030 Tamala Park
6320 Tambellup
6409 Tammin
6472 Tampu
6770 Tanami
6415 Tandegin
6065 Tapping
6530 Tarcoola Beach
6628 Tardun
6353 Tarin Rock
6213 Teesdale
6762 Telfer
6632 Tenindewa
6322 Tenterden
6556 The Lakes
6237 The Plains
6167 The Spectacles
6069 The Vines
6711 Thevenard Island
6239 Thomson Brook
6108 Thornlie
6519 Three Springs
6401 Throssell
6532 Tibradden
6361 Tincurrin
6333 Tingledale
0872 Tjirrkarli
0872 Tjukurla
6751 Tom Price
6244 Tonebridge
6566 Toodyay
6312 Toolibin
6532 Toolonga
6336 Toompup
6330 Torbay
6330 Torndirrup
6311 Townsendale
6431 Trafalgar
6488 Trayning
6164 Treeby
6284 Treeton
6333 Trent
6029 Trigg
6244 Trigwell
6060 Tuart Hill
6426 Turkey Hill
6280 Tutunup
6037 Two Rocks
6462 Ucarty
6460 Ucarty West
6220 Uduc
6436 Ularring
6239 Upper Capel
6390 Upper Murray
6069 Upper Swan
6258 Upper Warren
6537 Useless Loop
6230 Usher
6530 Utakarra
6532 Valentine
6330 Vancouver Peninsula
6355 Varley
6280 Vasse
6100 Victoria Park
6429 Victoria Rock
6432 Victory Heights
6230 Vittoria
6056 Viveash
6369 Wadderin
6509 Waddington
6515 Waddy Forest
6407 Waeel
6215 Wagerup
6530 Waggrakine
6315 Wagin
6169 Waikiki
6510 Walebing
6422 Walgoolan
6528 Walkaway
6721 Wallareenya
6429 Wallaroo
6076 Walliston
6330 Walmsley
6398 Walpole
6280 Walsall
6460 Walyormouring
6084 Walyunga National Park
6363 Walyurin
6383 Wamenusking
0872 Wanarn
6532 Wandana
6308 Wandering
6167 Wandi
6256 Wandillup
6530 Wandina
6503 Wanerie
6065 Wangara
6505 Wannamal
6210 Wannanup
6065 Wanneroo
6320 Wansbrough
0872 Warakurna
6220 Warawarrup
6431 Warburton
6311 Wardering
6405 Warding East
6743 Warmun
6169 Warnbro
6288 Warner Glen
6215 Waroona
6423 Warrachuppin
6518 Warradarge
6421 Warralakin
6330 Warrenup
6024 Warwick
6725 Waterbank
6407 Watercarrin
6152 Waterford
6228 Waterloo
6020 Watermans Bay
6513 Watheroo
6568 Wattening
6107 Wattle Grove
6166 Wattleup
6479 Wattoning
6530 Webberton
6044 Wedge Island
6315 Wedgecarrup
6721 Wedgefield
6477 Welbungin
6640 Weld Range
6170 Wellard
6233 Wellesley
6236 Wellington Forest
6236 Wellington Mill
6328 Wellstead
6106 Welshpool
6014 Wembley
6019 Wembley Downs
6606 West Ballidu
6450 West Beach
6532 West Binnu
6280 West Busselton
6330 West Cape Howe
6630 West Casuarinas
6214 West Coolup
6530 West End
6337 West Fitzgerald
6369 West Holleton
6430 West Kalgoorlie
6430 West Lamington
6007 West Leederville
6705 West Lyons River
6005 West Perth
6308 West Pingelly
6208 West Pinjarra
6309 West Popanyinning
6346 West River
6055 West Swan
6566 West Toodyay
6304 Westdale
6061 Westminster
6423 Westonia
6316 Westwood
6718 Whim Creek
6123 Whitby
6162 White Gum Valley
6532 White Peak
6068 Whiteman
6207 Whittaker
6473 Wialki
6532 Wicherina
6532 Wicherina South
6370 Wickepin
6720 Wickham
6443 Widgiemooltha
6743 Wijilawarrim
6302 Wilberforce
6041 Wilbinga
6243 Wilga
6243 Wilga West
6258 Wilgarrup
6479 Wilgoyne
6156 Willagee
6156 Willagee Central
6728 Willare
6155 Willetton
6333 William Bay
6391 Williams
6430 Williamstown
6330 Willyung
6107 Wilson
6646 Wiluna
6280 Wilyabrup
6450 Windabout
6262 Windy Harbour
0872 Wingellina
6255 Winnejup
6150 Winthrop
6286 Witchcliffe
6230 Withers
6751 Wittenoom
6447 Wittenoom Hills
6370 Wogolin
6221 Wokalup
6519 Womarden
6401 Wongamine
6603 Wongan Hills
6630 Wongoondy
6280 Wonnerup
6530 Wonthella
6316 Woodanilling
6056 Woodbridge
6018 Woodlands
6701 Woodleigh
6041 Woodridge
6026 Woodvale
6324 Woogenellup
6630 Woolgorong
6369 Woolocutty
6701 Wooramel
6558 Wooroloo
6530 Woorree
6562 Woottating
6225 Worsley
6612 Wubin
6560 Wundowie
6112 Wungong
6390 Wuraming
6485 Wyalkatchem
6568 Wyening
6740 Wyndham
6407 Wyola West
6609 Xantippe
6239 Yabberup
6330 Yakamia
6701 Yalardy
6635 Yalgoo
6535 Yallabatharra
6282 Yallingup
6282 Yallingup Siding
6280 Yalyalup
6035 Yanchep
6522 Yandanooka
6701 Yandoo Creek
6164 Yangebup
6258 Yanmah
6710 Yannarie
6509 Yarawindah
6525 Yardarino
6218 Yarloop
6522 Yarragadee
6507 Yathroo
6260 Yeagarup
6503 Yeal
6372 Yealering
6285 Yebble
6487 Yelbeni
6426 Yellowdine
6280 Yelverton
6571 Yerecoin
6532 Yetna
6430 Yilkari
6312 Yilliminning
6275 Yoganup
6060 Yokine
6060 Yokine South
6280 Yoongarillup
6302 York
6311 Yornaning
6256 Yornup
6383 Yoting
6407 Youndegin
6330 Youngs Siding
6225 Yourdamung Lake
6532 Yuna
6434 Zanthus
6536 Zuytdorp`;

const parse = (block: string): SuburbSeed[] =>
  block.split('\n').map((line) => ({
    postcode: line.slice(0, 4),
    name: line.slice(5),
  }));

export const SUBURBS_BY_STATE: Record<string, SuburbSeed[]> = {
  ACT: parse(ACT),
  NSW: parse(NSW),
  NT: parse(NT),
  QLD: parse(QLD),
  SA: parse(SA),
  TAS: parse(TAS),
  VIC: parse(VIC),
  WA: parse(WA),
};
