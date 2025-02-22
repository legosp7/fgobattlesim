package com.lego.fgobattlesim;

import java.util.ArrayList;

public class Avenger extends Servant {

    private String className = "Avenger";
    

    

    public Avenger(String name, int id, int rarity, int cost, int lvl_1_atk, int lvl_1_hp,
                    int max_atk, int max_hp, int grailAtk, int grailHp, int onetwentyAtk, int onetwentyHp, Attribute attribute, String GrowthCurve, int starAbsorption,
                    double starGeneration, double npChargeAtk, double npChargeDef, double deathRate,
                    Alignments_law law, Alignments_moral moral, String gender, ArrayList<String> traits,
                    ArrayList<String> deck, int quickHits, int artsHits, int busterHits, int extraHits,
                    CardTypes npCardType, String npRank, String npClassification, int npHits) {
        super(name, id, rarity, cost, lvl_1_atk, lvl_1_hp, max_atk, max_hp, grailAtk, grailHp, onetwentyAtk, onetwentyHp, attribute, GrowthCurve, starAbsorption,
              starGeneration, npChargeAtk, npChargeDef, deathRate, law, moral, gender, traits, deck, quickHits, artsHits,
              busterHits, extraHits, npCardType, npRank, npClassification, npHits);

        
        beastModAtk = 2;
        rulerModAtk = 2;
        mooncancerModAtk = 0.5;
        baseDmgMod = 1.1;
        baseStarAbs = 30.0;
        baseStarGen = 0.06;
        baseDeathRate = 0.10;


        
    }

    public String getClassName() {
        return className;
    }
    
}


