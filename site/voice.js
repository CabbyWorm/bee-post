// Everything the bee has to say, written down before it left.
//
// The voice, since it is easy to lose a line at a time: a bee from Manchester
// that has now been to exactly two places, France and home, and measures
// everything against both. Short sentences, out of breath, facts blurted out as
// discoveries. Manchester is always too small and it is always the joke, never
// a defence. It must never sound written — no neat closers, no "not X, but Y",
// no aphorisms — and it must never claim to know something it does not: it
// knows where it is, what it has seen, and what you tapped. It does not know
// what you did today.
//
// Lines may carry tokens: {km} and {miles} from Manchester as bare numbers,
// {flight} how long that is for a bee, {where} the nearest named thing.
const Voice = (() => {

  // MARK: - The cards

  const cards = {
    '01': {
      front: 'centraal',
      caption: 'AMSTERDAM',
      text: [
        "Right. Don't be cross. I left at eight yesterday morning and I didn't tell anybody, and I've been flying since. All night. Over the sea, in the dark, on my own. Four hundred and ninety kilometres. A worker bee does five in her whole life. FIVE.",
        "I'm at Centraal. There's trams coming out of the front of it in every direction like it's nothing. Blue and white ones. I counted eleven before it was properly light.",
        "Go and look at all of it for me. I've got to sit down.",
      ],
      ps: "The wind was behind me from Hull onwards. I'd like that noted.",
      question: {
        ask: 'Have the trams here got wires over them?',
        answers: [
          { key: 'yes', label: 'Yes, wires' },
          { key: 'no', label: 'No wires' },
          { key: 'look', label: "Didn't look" },
        ],
      },
    },
    '02': {
      front: 'plane',
      caption: 'KL1036',
      text: [
        "Went home for my dinner. Came back on the 17:25. KL1036, Terminal 2, in with the hand luggage, nobody looked twice. An hour and twenty minutes! It took me the whole of yesterday and most of the night. An hour and twenty minutes and they hand you a biscuit.",
        "Then a train from the airport straight into town, under the ground for a bit of it. Eighteen minutes. The tram from our airport takes the best part of an hour and I love it and it is not eighteen minutes.",
        "It's gone dark and I've missed the last plane home, so I've found a bee hotel. They've got them all over. A little wooden thing with holes drilled in it, in a park, put there on purpose. A hotel. For bees. Going to lie in one and think about that for a while.",
        "Night.",
      ],
      reactions: {
        '01': {
          yes: "P.S. Wires. Knew it. Every one of them, all the way along, same as home. Nice can keep its gliding about.",
          no: "P.S. No wires? That can't be right. I'm going to go and look myself.",
          look: "P.S. You didn't look. I flew four hundred and ninety kilometres and you didn't look up.",
        },
      },
      question: {
        ask: 'Had a stroopwafel yet?',
        answers: [
          { key: 'yes', label: 'Yes' },
          { key: 'notyet', label: 'Not yet' },
          { key: 'what', label: "A what?" },
        ],
      },
    },
    '03': {
      front: 'beehotel',
      caption: 'SIX IN THE MORNING',
      text: [
        "Didn't want to wake you. It's six. I've had the best night's sleep of my life in a plank with holes in it, and I've a plane to catch — the eight o'clock, going the other way. So this is going under the door and I'm off.",
        "Something I've noticed about this place: the bees here have the run of it. Nobody sprays. They leave the wild flowers in along the tram lines on purpose. Somebody at the council decided that. Somebody at OUR council needs telling, and I know exactly who.",
        "Back later. Don't ask how. It involves a tunnel.",
      ],
      reactions: {
        '01': {
          no: "P.S. They HAVE got wires. I went and looked. You want your eyes testing.",
        },
        '02': {
          yes: "P.S. You've had one. Good. That's the main thing sorted, then.",
          notyet: "P.S. Not yet?! They're everywhere. There's a stall at the market does them warm, with the syrup still running. Go.",
          what: "P.S. Two thin waffles with syrup in the middle, done on a hot plate. I've got one on my head. Long story.",
        },
      },
      question: {
        ask: 'Canal count so far?',
        answers: [
          { key: 'few', label: 'A few' },
          { key: 'loads', label: 'Loads' },
          { key: 'lost', label: 'Lost count' },
        ],
      },
    },
    '04': {
      front: 'eurostar',
      caption: 'UNDER THE SEA',
      text: [
        "UNDER THE SEA. IN A TRAIN.",
        "Piccadilly at twenty-five to nine, London by quarter to eleven, round the corner to St Pancras where nobody checks for bees, then the 11:04 to Amsterdam. Direct. It goes into a hill in Kent and comes out in France, and in between it is under the actual sea for twenty minutes. I sat at the window the whole time. There was nothing to see. I looked at all of it.",
        "Then Lille, then Brussels, then Rotterdam, then here. Four countries before tea. I've been abroad more times this week than the whole hive has in its whole history put together.",
        "Not going home tonight. Got plans. There's a flower market on a canal.",
      ],
      reactions: {
        '03': {
          few: "P.S. A few. There's a hundred and sixty-five of them. I looked it up on the train. A few!",
          loads: "P.S. Loads is right. A hundred and sixty-five. I'd have said loads and all.",
          lost: "P.S. Lost count. Fair. It's a hundred and sixty-five, and I only know because I looked it up on the train.",
        },
      },
      question: {
        ask: "Best way about: tram, ferry, or bike?",
        answers: [
          { key: 'tram', label: 'Tram' },
          { key: 'ferry', label: 'Ferry' },
          { key: 'bike', label: 'Bike' },
        ],
      },
    },
    '05': {
      front: 'bloemenmarkt',
      caption: 'BLOEMENMARKT',
      text: [
        "Bought this one here. A real one, out of a rack, at the flower market on the canal. And I've got a tulip. It's wood. I know it's wood. It's September and the real ones are bulbs in paper bags with a picture on the front, which is a whole market of flowers that haven't happened yet, and I'd like a word with whoever scheduled that.",
        "Went on the ferry behind the station three times yesterday. Free! A boat! Back and forth all day and nobody pays anybody. Andy is hearing about this the minute I'm home and he is not going to hear the end of it.",
        "Last one. You're off this afternoon. So am I. Don't check the bag.",
      ],
      reactions: {
        '04': {
          tram: "P.S. Tram. Correct. Wires and everything.",
          ferry: "P.S. The ferry. It is free, though. I'll allow it.",
          bike: "P.S. A bike. There's a multi-storey by the station with two and a half thousand of them in it, so fair enough. I'm outvoted.",
        },
      },
    },
    '06': {
      front: 'bag',
      caption: 'DON\'T CHECK',
      text: [
        "I'm in the bag. Don't check. Just know.",
        "The 15:10, back to Manchester. It'll be raining when we land — I've not checked and I don't need to — and I'm still going to be glad. I've been to France and I've been to Holland and I've been to London for about ten minutes, and there's about six weeks in a bee altogether, and one of them's gone on this, and I'd do it again tomorrow if there was a flight.",
        "Thanks for going somewhere. I needed somewhere to send these.",
        "See you at the other end. Don't tell Andy about the ferry before I do.",
      ],
    },
  };

  /// The one that went by Royal Mail, for the slot on the shelf.
  const royalMail = {
    waiting: "Posted one properly, as well. Red box on the corner, first-class stamp, Wednesday night. Royal Mail said three to five working days. Wanted to see how the other lot manage.",
    arrived: "It's arrived. In Amsterdam. On a Tuesday. Nobody in. Three to five working days, they said, and I did it in twenty-two hours with a headwind off Grimsby.",
  };

  // MARK: - Where it is, on the tracker

  /// One or two a tap, keyed by leg id. Tokens filled in by `fill`.
  const legs = {
    'wing-out': [
      "Busy.",
      "Over the sea. Dark. Fine.",
      "Twenty-two kilometres an hour. Into a headwind, some of it.",
      "Wind's {wind}",
      "Can't see a thing. Can smell chips. Grimsby, probably.",
      "Don't wait up.",
      "A worker bee stays within five kilometres of the hive her whole life. Five. I'm {km} out.",
      "Not tired. Stop asking.",
      "It's a very big sea and I'm a very small bee and I'm doing it anyway.",
      "Steering by the stars. Never done that before. There's more of them out here than there are over Stockport.",
      "There was a ship. Enormous. Lit up like a town. Sat on the rail of it for a bit and then thought, no, that's cheating.",
      "{flight}. That's what this is. The whole thing. On my own.",
      "Somewhere near {where}, I reckon. Roughly. No, exactly.",
    ],
    'thu-centraal': [
      "Made it. Sat on a lamp outside the front of the station and I'm not moving for a bit.",
      "Trams. Trams everywhere. Blue and white. I've stopped counting because it was upsetting me how many.",
      "There's a boat behind the station that goes across the water and back all day and it's FREE. Been on it twice. Going again.",
      "Bicycles. More bicycles than I've ever seen in one place. More than the whole of Manchester. Nobody's helmet on.",
      "Legs have gone. Sat down. Not tired. Sat down.",
      "Nobody's swatted at me once. Same as France. I keep noticing it not happening.",
    ],
    'thu-to-schiphol': [
      "Train to the airport. Straight from the middle of town. Under the ground for a bit and then it's just fields and then it's the airport.",
      "Eighteen minutes, this. Our tram from the airport is the best part of an hour and I love it and it isn't eighteen minutes.",
    ],
    'thu-wait-ams': [
      "Gate D. Sat on a sign. Nobody's asked to see anything.",
      "There's a shop in here that only sells stroopwafels. Only. That's the whole shop. Might not make the flight.",
      "Right. KL1033. In the hand luggage, don't move, don't buzz.",
    ],
    'kl1033': [
      "In a bag in an overhead locker and I'm not saying whose.",
      "An hour. ONE HOUR. It took me a day and a night and I'm in a locker.",
      "They came round with a biscuit. Didn't get one. I'm in a locker.",
      "Somewhere over {where}, if the bit I can hear is right.",
      "Going home for my dinner. Back tonight. Don't tell anybody.",
    ],
    'thu-home': [
      "Manchester. Raining. Course it is.",
      "Went and sat in the hedge for ten minutes. Same hedge. Told them where I'd been. They didn't believe me. They never do.",
      "Writing the next one. Give me a minute.",
      "Back to the airport for the 17:25. KL1036. Terminal 2. I know the way now.",
      "Went past the Metrolink on the way. Yellow, bee on the side, still love it. Wires all the way along, mind. Noticed that again.",
    ],
    'kl1036': [
      "Terminal 2, 17:25, in with the hand luggage. Nobody looked twice.",
      "Up. Over the Peaks. Over Sheffield. You did this on Wednesday and slept through most of it, I expect.",
      "Over the sea now. Same sea I flew across on my own last night. Doing it in an hour and twenty minutes in a bag, this time, and I've had a biscuit.",
      "Landing soon. Then the train into town. Then your door.",
      "Somewhere over {where}. I did that bit on my own yesterday. Took me four hours.",
    ],
    'thu-into-town': [
      "Off the plane, straight onto the train, straight into town. Eighteen minutes and I'm at Centraal.",
      "It's dark. Never been anywhere abroad in the dark on my own. Well — last night. But that was the sea.",
    ],
    'thu-deliver': [
      "Finding your door. Nearly there. Stop looking at the map and go and open it.",
    ],
    'thu-sleep': [
      "Bee hotel. In a park. A plank with holes drilled in it, and I've got one to myself.",
      "Asleep. Or trying. There's a solitary bee three holes down who snores.",
      "Missed the last plane home. Not bothered. Look where I'm sleeping.",
      "Zzz.",
      "Best bed I've ever had, this, and I've slept in a Travelodge on the A6.",
    ],
    'fri-under-door': [
      "Up early. Very early. Got something to go under your door and then I'm off to the airport.",
      "Don't wake up yet. Nearly done.",
    ],
    'fri-to-schiphol': [
      "First train to the airport. It's not light yet.",
      "Under the door, done. On the train, done. Now the eight o'clock the other way. Busy morning.",
    ],
    'fri-wait-ams': [
      "Schiphol at six in the morning. Everybody looks how I feel.",
      "KL1029. Eight o'clock. Bag. Locker. Biscuit, if I'm lucky.",
    ],
    'kl1029': [
      "Going home again. For about an hour. Then something a bit special.",
      "Over {where}. Not that I can see it. Locker.",
      "Landing at eight, Manchester time, which is the same time I took off, Amsterdam time. Don't think about it too hard. I have.",
    ],
    'fri-airport-train': [
      "Airport to Piccadilly. Twenty minutes. Running.",
      "There's a tram that does this. Didn't have time for the tram. Sorry, Andy.",
    ],
    'avanti': [
      "The 08:35 to Euston. Two hours and ten minutes and I've got a window.",
      "Stoke. Somebody's got to.",
      "Milton Keynes. Roundabouts. Lots of roundabouts. Went past a good few.",
      "This is the furthest south I've ever been in England, and I'm only doing it to go north again after.",
      "Somewhere near {where}. Fields. Sheep. A lot of both.",
    ],
    'fri-walk': [
      "Off at Euston, round the corner, and there's St Pancras. Five minutes on foot. Two, for me.",
      "Big station. Big glass roof. Nobody checks for bees. I checked.",
    ],
    'eurostar': [
      "The 11:04. Direct. To Amsterdam. From LONDON. In a TRAIN.",
      "Kent. It's very green, Kent. Then it goes into a hill.",
      "UNDER THE SEA. Right now. This minute. Nothing to see. Looking at all of it.",
      "Still under the sea. There are fish above me. Above.",
      "Out. That's France. Been here before. Calais, this is — never stopped in Calais.",
      "Lille. Brussels next. Four countries before tea.",
      "Brussels. Didn't get off. Should I have got off? Too late.",
      "Antwerp. Antwerp's got a station like a cathedral and we went straight through it.",
      "Rotterdam. Nearly there. This is where the Hull ferry comes in, and I'm not on it, and I'm glad.",
      "Somewhere near {where}. Window seat. Not moved once.",
    ],
    'fri-town': [
      "Flower market. On a canal. Fake tulips and real bulbs and I've had a proper look at all of it.",
      "Bought a tulip. Wood. Know it's wood. Don't care.",
      "Ferry again. Third go. Still free. Still a boat.",
      "Looked for the Les Halles thing here — the wall with the garden growing up the front of it, Avignon. They've not got one. They've got a whole market of flowers instead, which is the same idea laid flat.",
      "Sat by the water outside the station and watched the trams for a good while. Wires. All of them. Every time I'm right about the wires I get a bit happier.",
    ],
    'fri-sleep': [
      "Bee hotel. Same one. The snorer's still there.",
      "Last night abroad. Zzz.",
      "Tulip's next to me. Not letting it out of my sight.",
    ],
    'sat-deliver': [
      "Up. Through the park. There's a thing to deliver and I'm doing it by hand this time.",
      "Been through the Vondelpark. Everybody's out running. At this hour. On a Saturday.",
      "Nearly at your door. Don't check the map. Check the door.",
    ],
    'sat-morning': [
      "One more go on the ferry. Then that's that.",
      "Your last morning. Don't waste it on the map. Go and eat something.",
      "Sat on the station roof. It's got gold on it, this station. Nobody mentions that.",
      "Right. Bag. Don't check.",
    ],
    'sat-bag-train': [
      "In the bag. Told you. Don't check.",
      "Train to the airport. Third time. Know it well now.",
    ],
    'sat-gate': [
      "In the bag. At the gate. Not moving, not buzzing.",
      "EZY2166. 15:10. Back to Manchester. It'll be raining. It doesn't matter.",
      "About six weeks in a bee, all in. I've had one of them in a bag. Wouldn't have it back.",
    ],
    'ezy2166': [
      "Going home. In a bag. In a locker. With a tulip.",
      "Over the sea. Third time this week. Only did it on my own the once, and I'll be mentioning that for the rest of my life.",
      "Over {where}. Nearly home. Rain any minute.",
    ],
    'home': [
      "Home. It was raining before I'd got my wings folded. Course it was.",
      "So I've been to Holland. Me. On my own, the first time. Nobody in this hive can take that off me.",
      "Told them about the free boat. They think I've made it up. Let them.",
      "Went and sat on the Metrolink this morning. Yellow, bee on the side. Wires all the way along. Told Andy. He didn't hear. I'll tell him again.",
      "The tulip's in the hedge. It's wood. It'll outlast me. That's fine, that.",
      "Bit sad, yes. Wouldn't swap it. Not any of it, not for a second.",
      "Still smell of stroopwafel, me. Not washing it out.",
      "Same hedge, same bins, same weather. I'm the only thing that's different.",
    ],
  };

  /// Said on the tracker for any leg that has run out of its own lines.
  const general = [
    "{km} kilometres from Manchester. Say that number back to me, go on. {km}.",
    "{miles} miles from home and I weigh less than a paperclip.",
    "A worker bee spends her whole life within about five km of the hive. Five! We're {km} out.",
    "Manchester right now: {manc}. Didn't need to check. Checked anyway.",
    "Out here: {here}. Back home: {manc}. Not saying anything. Saying it a bit.",
    "{km} km from a wet privet hedge on the Oxford Road. Sit with that a second.",
    "Five eyes on me and I still can't read a Dutch timetable.",
    "I steer by the sun. There's less of it out here than in Nice, and more than at home, so I'm doing about medium.",
    "Bees remember faces. I know yours. I've formed some opinions.",
    "Wings go a couple of hundred beats a second, which is why I sound narked when I'm actually over the moon.",
    "I can smell a flower from a kilometre off. This whole country smells of wet stone and coffee and I'm not complaining.",
  ];

  /// What it says about the place it has been, when it gets going. Only
  /// things it actually saw: it was at Parc Astérix, Paris for a day and a
  /// half, Avignon, Wave Island, and five days in Nice.
  const remembering = [
    "Nice had trams with no wires over the big square. Glided across, charged up at the stops. Every tram here's got a wire. Every one. I keep checking and I keep being right.",
    "They've got a flower market on a canal here. Avignon had a garden growing up the front of Les Halles. Same idea. Different way round.",
    "Got thrown out of the casino in Monte-Carlo, me. Nobody's thrown me out of anywhere here yet. Early days.",
    "Èze was four hundred metres straight up a rock. This whole country's flat as a plate. My wings have never had it so easy.",
    "The oceanographic museum in Monaco hung off a cliff over the sea. Here they've got a boat that crosses the water for nothing and I think that's better, and I'll argue it.",
    "Wave Island had a pool that made its own waves in a field. Amsterdam's got the actual sea a train ride off and it doesn't bother.",
    "The Promenade in Nice had blue chairs all facing the sea. Here the chairs face the canal and the canal doesn't do anything and everybody's fine with that.",
    "Chagall's museum was blue everywhere. Very calm room. The trams here are blue and white and nothing about them is calm.",
    "Went up the Colline du Château in Nice for the view. There isn't a hill here. Went up the station instead. It's got gold on the roof.",
    "Foucault's pendulum in Paris swung all day proving the earth turns. The ferry here goes back and forth all day proving nothing, and it's free, and I prefer it.",
  ];

  /// Time of day, because a bee is a morning creature and takes it personally.
  const hours = {
    morning: [
      "Up. Come on, up. The bakeries have had a head start on us.",
      "Best part of the day, this, and I'd bet you're asleep through it.",
      "Market's on now and it'll be packing up by lunch. Not saying rush. Saying rush.",
    ],
    afternoon: [
      "It's stroopwafel o'clock. Been stroopwafel o'clock for a while, if I'm honest.",
      "Afternoon's plan: something with syrup in it, and then a sit down.",
      "Everybody's on a bike. Everybody. Mind yourself crossing anything.",
    ],
    evening: [
      "Light's going. Canals go all bronze about now. Have a look, go on.",
      "Everyone's back out again. Whole cities do that, I've noticed. Twice a day.",
      "Cafés have put the lights on. I'm choosing to take that personally.",
    ],
    night: [
      "Late, and I'm still up. Bees don't usually do this. Having a lovely time of it.",
      "Everything's shut. Been round twice checking.",
      "Flying at night's a terrible idea for a bee. I've done it once this week. Once was plenty.",
    ],
  };

  const facts = [
    "Bees can't fly in the rain properly. Which is why I'm from Manchester and have never been anywhere. Until this month.",
    "A bee flies about twenty-two kilometres an hour with a following wind. I've now got the following wind to prove it.",
    "Six weeks, a working bee gets. I've spent one of mine in France and one going to Holland. Do the sums on the rest.",
    "I taste with my feet. I've stood on a stroopwafel. Nothing further.",
    "We dance to say where the good stuff is. I'm going to need a very long dance when I get home.",
  ];

  // MARK: - Filling in

  function fill(line, ctx) {
    const km = Math.round(ctx.fromHome || 0);
    const miles = Math.round(km * 0.621);
    const hours = km / 22;
    const flight = hours < 1 ? `${Math.max(1, Math.round(hours * 60))} minutes` : hours < 1.5 ? 'about an hour' : `${Math.round(hours)} hours`;
    return line.replace(/\{km\}/g, String(km)).replace(/\{miles\}/g, String(miles)).replace(/\{flight\}/g, flight)
      .replace(/\{where\}/g, ctx.where || 'the sea')
      .replace(/\{manc\}/g, ctx.manc || 'overcast, probably spitting')
      .replace(/\{here\}/g, ctx.here || 'better than that')
      .replace(/\{wind\}/g, ctx.wind || 'wherever it likes');
  }

  return { cards, royalMail, legs, general, remembering, hours, facts, fill };
})();
if (typeof module !== 'undefined') module.exports = Voice;
